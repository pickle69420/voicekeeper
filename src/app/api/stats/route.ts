import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get total recordings and time
    const recordings = await prisma.recording.findMany({
      select: { duration: true },
    });

    const totalRecordings = recordings.length;
    const totalSeconds = recordings.reduce(
      (sum, r) => sum + (r.duration || 0),
      0
    );

    // Get total games played and average score
    const games = await prisma.brainGameSession.findMany({
      select: { score: true, maxScore: true },
    });

    const totalGames = games.length;
    const avgScore = totalGames > 0
      ? games.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / totalGames
      : 0;

    // Calculate streak from recent activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecordings = await prisma.recording.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Get unique dates with activity
    const activityDates = new Set<string>();
    recentRecordings.forEach((r) => activityDates.add(r.createdAt.toISOString().split("T")[0]));

    // Calculate streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toISOString().split("T")[0];

      if (activityDates.has(dateKey)) {
        currentStreak++;
      } else if (i > 0) {
        // Allow today to not have activity yet
        break;
      }
    }

    return NextResponse.json({
      totalRecordings,
      totalMinutes: Math.round(totalSeconds / 60),
      totalGames,
      avgScore: Math.round(avgScore),
      currentStreak,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({
      totalRecordings: 0,
      totalMinutes: 0,
      totalGames: 0,
      avgScore: 0,
      currentStreak: 0,
    });
  }
}
