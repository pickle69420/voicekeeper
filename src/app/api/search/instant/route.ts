import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Use Prisma's contains for basic text search
    const transcripts = await prisma.transcript.findMany({
      where: {
        text: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
      include: {
        recording: {
          select: {
            id: true,
            createdAt: true,
            title: true,
            duration: true,
          },
        },
      },
    });

    const results = transcripts.map((item) => {
      const snippet = extractSnippet(item.text, query);

      return {
        recording_id: item.recordingId,
        date: item.recording.createdAt.toISOString().split("T")[0],
        title: item.recording.title,
        duration_seconds: item.recording.duration,
        snippet,
        source_type: "keyword" as const,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Instant search error:", error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

function extractSnippet(text: string, query: string): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return text.slice(0, 150) + (text.length > 150 ? "..." : "");
  }

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + query.length + 60);

  let snippet = text.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}
