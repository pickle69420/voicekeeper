import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameType, score, duration, difficulty } = body;

    if (!gameType || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert difficulty number to string if needed
    let difficultyStr = "medium";
    if (typeof difficulty === "number") {
      difficultyStr = difficulty === 1 ? "easy" : difficulty === 3 ? "hard" : "medium";
    } else if (typeof difficulty === "string") {
      difficultyStr = difficulty;
    }

    // Create game session
    const session = await prisma.brainGameSession.create({
      data: {
        gameType,
        score,
        maxScore: 100,
        difficulty: difficultyStr,
        duration: duration || null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Error saving game session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const gameType = searchParams.get("gameType");

    const sessions = await prisma.brainGameSession.findMany({
      where: gameType ? { gameType } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching game sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
