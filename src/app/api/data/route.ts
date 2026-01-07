import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE() {
  try {
    // Get all recordings to delete their audio files
    const recordings = await prisma.recording.findMany({
      select: {
        audioUrl: true,
      },
    });

    // Delete audio files from local storage
    for (const recording of recordings) {
      if (recording.audioUrl && recording.audioUrl.startsWith("/uploads/")) {
        try {
          const filePath = join(process.cwd(), "public", recording.audioUrl);
          await unlink(filePath);
        } catch {
          // File might not exist, continue
          console.log("Could not delete file:", recording.audioUrl);
        }
      }
    }

    // Delete all data in correct order (respecting foreign keys)
    await prisma.embedding.deleteMany();
    await prisma.transcript.deleteMany();
    await prisma.recording.deleteMany();
    await prisma.brainGameSession.deleteMany();
    await prisma.userStats.deleteMany();

    return NextResponse.json({
      success: true,
      message: "All data has been deleted",
    });
  } catch (error) {
    console.error("Delete all data error:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
