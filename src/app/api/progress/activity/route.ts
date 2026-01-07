import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get recordings grouped by date
    const recordings = await prisma.recording.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        duration: true,
      },
    });

    // Get game sessions grouped by date
    const gameSessions = await prisma.brainGameSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        score: true,
      },
    });

    // Group by date
    const activityMap = new Map<string, { recordings: number; minutes: number; games: number; avgScore: number; scores: number[] }>();

    recordings.forEach((r) => {
      const dateKey = r.createdAt.toISOString().split("T")[0];
      const existing = activityMap.get(dateKey) || { recordings: 0, minutes: 0, games: 0, avgScore: 0, scores: [] };
      existing.recordings++;
      existing.minutes += (r.duration || 0) / 60;
      activityMap.set(dateKey, existing);
    });

    gameSessions.forEach((g) => {
      const dateKey = g.createdAt.toISOString().split("T")[0];
      const existing = activityMap.get(dateKey) || { recordings: 0, minutes: 0, games: 0, avgScore: 0, scores: [] };
      existing.games++;
      existing.scores.push(g.score);
      activityMap.set(dateKey, existing);
    });

    // Convert to array and calculate averages
    const activity = Array.from(activityMap.entries()).map(([date, data]) => ({
      date,
      recordings: data.recordings,
      minutes: Math.round(data.minutes * 10) / 10,
      games: data.games,
      avgScore: data.scores.length > 0 
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) 
        : 0,
    }));

    // Sort by date descending
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json({ activity: [] });
  }
}
