import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import type { Word, Chunk } from "@/types";
import * as fs from "fs/promises";
import * as path from "path";

// Local storage directory for audio files
const AUDIO_DIR = path.join(process.cwd(), "public", "uploads", "audio");

async function ensureAudioDir() {
  try {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const audioFile = formData.get("audio") as File;
    const duration = parseInt(formData.get("duration") as string, 10);
    const wordsJson = formData.get("words") as string;
    const text = formData.get("text") as string;

    if (!audioFile || isNaN(duration)) {
      return NextResponse.json(
        { error: "Missing required fields: audio, duration" },
        { status: 400 }
      );
    }

    const recordingId = uuidv4();

    // Save audio file locally
    await ensureAudioDir();
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioFileName = `${recordingId}.webm`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);
    await fs.writeFile(audioPath, audioBuffer);
    
    const audioUrl = `/uploads/audio/${audioFileName}`;

    // Parse words
    let words: Word[] = [];

    try {
      if (wordsJson) words = JSON.parse(wordsJson);
    } catch {
      console.error("Failed to parse words JSON");
    }

    // Generate title from first few words
    const title = text
      ? text.split(" ").slice(0, 6).join(" ") + (text.split(" ").length > 6 ? "..." : "")
      : `Recording ${new Date().toLocaleString()}`;

    // Create recording in database
    const recording = await prisma.recording.create({
      data: {
        id: recordingId,
        audioUrl,
        duration,
        fileSize: audioBuffer.length,
        title,
        description: text || null,
      },
    });

    // Create transcript
    if (text) {
      await prisma.transcript.create({
        data: {
          recordingId: recording.id,
          text,
          language: "en",
          words: words as unknown as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
    }

    // Generate embeddings in background (if configured)
    generateEmbeddingsAsync(recording.id).catch(console.error);

    return NextResponse.json({
      success: true,
      recording: {
        id: recording.id,
        audioUrl: recording.audioUrl,
        duration: recording.duration,
        title: recording.title,
        createdAt: recording.createdAt,
      },
    });
  } catch (error) {
    console.error("Recording POST error:", error);
    return NextResponse.json(
      { error: "Failed to save recording" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const recordings = await prisma.recording.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        transcript: {
          select: {
            text: true,
          },
        },
      },
    });

    const formattedRecordings = recordings.map((r) => ({
      id: r.id,
      audioUrl: r.audioUrl,
      duration: r.duration,
      title: r.title,
      description: r.description,
      createdAt: r.createdAt,
      transcript: r.transcript?.text || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecordings,
    });
  } catch (error) {
    console.error("Recordings GET error:", error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

async function generateEmbeddingsAsync(recordingId: string) {
  try {
    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      console.log("Skipping embeddings - API keys not configured");
      return;
    }

    const transcript = await prisma.transcript.findUnique({
      where: { recordingId },
    });

    if (!transcript) {
      console.error("No transcript found for recording:", recordingId);
      return;
    }

    const { chunkTranscript } = await import("@/lib/chunking");
    const { generateEmbeddings: genEmbed } = await import("@/lib/openai");
    const { upsertVectors } = await import("@/lib/pinecone");

    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: { createdAt: true, title: true },
    });

    const chunks: Chunk[] = chunkTranscript(
      transcript.words as unknown as Word[],
      undefined
    );

    if (chunks.length === 0) {
      console.log("No chunks generated for recording:", recordingId);
      return;
    }

    const texts = chunks.map((c: Chunk) => c.text);
    const embeddings = await genEmbed(texts);

    const vectors = chunks.map((chunk: Chunk, i: number) => ({
      id: `${recordingId}_chunk_${chunk.index}`,
      values: embeddings[i],
      metadata: {
        recording_id: recordingId,
        chunk_index: chunk.index,
        chunk_text: chunk.text.substring(0, 1000),
        start_time: chunk.start_time,
        end_time: chunk.end_time,
        date: recording?.createdAt?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        confidence: chunk.avg_confidence,
      },
    }));

    await upsertVectors(vectors);

    // Save embeddings to database
    const embeddingRecords = chunks.map((chunk: Chunk) => ({
      recordingId,
      chunkText: chunk.text,
      chunkIndex: chunk.index,
      pineconeId: `${recordingId}_chunk_${chunk.index}`,
    }));

    await prisma.embedding.createMany({
      data: embeddingRecords,
    });

    console.log(`Generated ${chunks.length} embeddings for recording:`, recordingId);
  } catch (error) {
    console.error("Error generating embeddings:", error);
  }
}
