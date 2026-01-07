import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RAGSource, PineconeMetadata } from "@/types";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body = await request.json();
        const { query } = body;

        if (!query || query.length < 2) {
          sendEvent({ type: "error", error: "Query too short" });
          controller.close();
          return;
        }

        // Phase 1: Send searching status
        sendEvent({ type: "status", content: "Searching your memories..." });

        // Check if Pinecone and OpenAI are configured
        const hasPinecone = !!process.env.PINECONE_API_KEY;
        const hasOpenAI = !!process.env.OPENAI_API_KEY;

        let semanticResults: Array<{ score?: number; metadata: PineconeMetadata }> = [];

        if (hasPinecone && hasOpenAI) {
          try {
            const { generateEmbedding } = await import("@/lib/openai");
            const { queryVectors } = await import("@/lib/pinecone");

            const queryEmbedding = await generateEmbedding(query);
            const pineconeResults = await queryVectors(queryEmbedding, 5);
            // Filter out results without metadata
            semanticResults = pineconeResults
              .filter((r): r is typeof r & { metadata: PineconeMetadata } => r.metadata !== undefined);
          } catch (e) {
            console.error("Semantic search error:", e);
          }
        }

        // Keyword search fallback
        const keywordResults = await prisma.transcript.findMany({
          where: {
            text: {
              contains: query,
              mode: "insensitive",
            },
          },
          take: 5,
          include: {
            recording: {
              select: { createdAt: true, title: true },
            },
          },
        });

        // Merge results
        const sources: RAGSource[] = [];
        const seenRecordings = new Set<string>();

        // Add semantic results
        for (const match of semanticResults) {
          const metadata = match.metadata;
          if (!seenRecordings.has(metadata.recording_id)) {
            sources.push({
              recording_id: metadata.recording_id,
              date: metadata.date,
              start_time: metadata.start_time,
              end_time: metadata.end_time,
              chunk_text: metadata.chunk_text,
              relevance_score: match.score || 0,
            });
            seenRecordings.add(metadata.recording_id);
          }
        }

        // Add keyword results
        for (const result of keywordResults) {
          if (!seenRecordings.has(result.recordingId)) {
            sources.push({
              recording_id: result.recordingId,
              date: result.recording.createdAt.toISOString().split("T")[0],
              start_time: 0,
              end_time: 0,
              chunk_text: result.text.substring(0, 500),
              relevance_score: 0.5,
            });
            seenRecordings.add(result.recordingId);
          }
        }

        const topSources = sources
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, 5);

        if (topSources.length === 0) {
          sendEvent({
            type: "token",
            content: "I couldn't find any recordings that match your question. Try recording more memories or asking a different question.",
          });
          sendEvent({ type: "sources", sources: [] });
          sendEvent({ type: "done" });
          controller.close();
          return;
        }

        // Send sources
        sendEvent({ type: "sources", sources: topSources });

        if (hasOpenAI) {
          // Phase 2: Generate RAG answer
          const dates = Array.from(new Set(topSources.map((s) => s.date))).slice(0, 3);
          sendEvent({
            type: "status",
            content: `Analyzing ${topSources.length} recordings from ${dates.join(", ")}...`,
          });

          const { buildRAGPrompt, RAG_SYSTEM_PROMPT, streamChatCompletion } = await import("@/lib/openai");

          const ragPrompt = buildRAGPrompt(
            query,
            topSources.map((s) => ({
              date: s.date,
              speaker: s.speaker,
              chunk_text: s.chunk_text,
            }))
          );

          sendEvent({ type: "status", content: "Generating answer..." });

          // Stream the response
          for await (const token of streamChatCompletion(RAG_SYSTEM_PROMPT, ragPrompt)) {
            sendEvent({ type: "token", content: token });
          }
        } else {
          // No OpenAI - just show snippets
          sendEvent({
            type: "token",
            content: `Found ${topSources.length} relevant recordings. Here are some excerpts:\n\n`,
          });
          
          for (const source of topSources.slice(0, 3)) {
            sendEvent({
              type: "token",
              content: `From ${source.date}: "${source.chunk_text.substring(0, 200)}..."\n\n`,
            });
          }
        }

        // Generate suggestions
        const suggestions = [
          "Tell me more about this",
          "What else happened that day?",
          "Any related memories?",
        ];
        sendEvent({ type: "suggestions", suggestions });
        sendEvent({ type: "done" });
      } catch (error) {
        console.error("Stream search error:", error);
        sendEvent({ type: "error", error: "Search failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
