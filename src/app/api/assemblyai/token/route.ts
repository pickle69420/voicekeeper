import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AssemblyAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Request a temporary authentication token from AssemblyAI
    const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_in: 3600, // 1 hour
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AssemblyAI token error:", error);
      return NextResponse.json(
        { error: "Failed to get transcription token" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("AssemblyAI token error:", error);
    return NextResponse.json(
      { error: "Failed to get transcription token" },
      { status: 500 }
    );
  }
}
