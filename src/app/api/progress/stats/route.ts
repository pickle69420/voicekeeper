import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get total recordings count
    const totalRecordings = await prisma.recording.count();

    // Get total duration
    const durationResult = await prisma.recording.aggregate({
      _sum: {
        duration: true,
      },
    });
    const totalMinutes = Math.round((durationResult._sum.duration || 0) / 60);

    // Get total games played
    const totalGames = await prisma.brainGameSession.count();

    // Get average game score
    const scoreResult = await prisma.brainGameSession.aggregate({
      _avg: {
        score: true,
      },
    });
    const avgScore = Math.round(scoreResult._avg.score || 0);

    // Calculate current streak (consecutive days with activity)
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const recentGames = await prisma.brainGameSession.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get unique dates with activity
    const activityDates = new Set<string>();
    recentRecordings.forEach((r) => activityDates.add(r.createdAt.toISOString().split("T")[0]));
    recentGames.forEach((g) => activityDates.add(g.createdAt.toISOString().split("T")[0]));

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

    // Get weekly comparison
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeekRecordings = await prisma.recording.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const lastWeekRecordings = await prisma.recording.count({
      where: {
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo,
        },
      },
    });

    const weeklyChange = lastWeekRecordings > 0
      ? Math.round(((thisWeekRecordings - lastWeekRecordings) / lastWeekRecordings) * 100)
      : thisWeekRecordings > 0 ? 100 : 0;

    return NextResponse.json({
      totalRecordings,
      totalMinutes,
      totalGames,
      avgScore,
      currentStreak,
      weeklyChange,
      thisWeekRecordings,
      lastWeekRecordings,
    });
  } catch (error) {
    console.error("Progress stats error:", error);
    return NextResponse.json({
      totalRecordings: 0,
      totalMinutes: 0,
      totalGames: 0,
      avgScore: 0,
      currentStreak: 0,
      weeklyChange: 0,
      thisWeekRecordings: 0,
      lastWeekRecordings: 0,
    });
  }
}
