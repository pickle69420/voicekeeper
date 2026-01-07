import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get total games count directly
    const gamesPlayed = await prisma.brainGameSession.count();

    // Get user stats
    const userStats = await prisma.userStats.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    // Get recent game sessions
    const sessions = await prisma.brainGameSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { score: true },
    });

    const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
    const averageScore = sessions.length ? Math.round(totalScore / sessions.length) : 0;

    // Check if last activity was consecutive
    const isConsecutive = userStats?.lastActivityAt
      ? isConsecutiveDay(userStats.lastActivityAt)
      : false;

    return NextResponse.json({
      gamesPlayed,
      totalScore,
      currentStreak: isConsecutive ? (userStats?.currentStreak || 0) : 0,
      bestStreak: userStats?.longestStreak || 0,
      averageScore,
      lastPlayedAt: userStats?.lastActivityAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching game stats:", error);
    return NextResponse.json({
      gamesPlayed: 0,
      totalScore: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageScore: 0,
      lastPlayedAt: null,
    });
  }
}

function isConsecutiveDay(lastPlayed: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(lastPlayed.getFullYear(), lastPlayed.getMonth(), lastPlayed.getDate());
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
}
