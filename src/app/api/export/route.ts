import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    // Get all recordings with transcripts
    const recordings = await prisma.recording.findMany({
      include: {
        transcript: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all game sessions
    const gameSessions = await prisma.brainGameSession.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user stats
    const stats = await prisma.userStats.findFirst();

    const exportData = {
      exportedAt: new Date().toISOString(),
      recordings: recordings.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        duration: r.duration,
        audioUrl: r.audioUrl,
        createdAt: r.createdAt,
        transcript: r.transcript
          ? {
              text: r.transcript.text,
              confidence: r.transcript.confidence,
            }
          : null,
      })),
      gameSessions: gameSessions.map((g) => ({
        id: g.id,
        gameType: g.gameType,
        score: g.score,
        duration: g.duration,
        difficulty: g.difficulty,
        completedAt: g.completedAt,
        createdAt: g.createdAt,
      })),
      stats: stats
        ? {
            totalRecordings: stats.totalRecordings,
            totalMinutes: stats.totalMinutes,
            totalGames: stats.totalGames,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
          }
        : null,
    };

    if (format === "csv") {
      // Create CSV for recordings
      const csvRows = [
        ["Type", "ID", "Title/Game", "Duration", "Date", "Transcript/Score"].join(","),
      ];

      recordings.forEach((r) => {
        csvRows.push(
          [
            "Recording",
            r.id,
            `"${(r.title || "").replace(/"/g, '""')}"`,
            r.duration || 0,
            r.createdAt.toISOString(),
            `"${(r.transcript?.text || "").replace(/"/g, '""').substring(0, 200)}"`,
          ].join(",")
        );
      });

      gameSessions.forEach((g) => {
        csvRows.push(
          [
            "Game",
            g.id,
            g.gameType,
            g.duration || 0,
            g.createdAt.toISOString(),
            g.score,
          ].join(",")
        );
      });

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="voicekeeper-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Default to JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="voicekeeper-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
