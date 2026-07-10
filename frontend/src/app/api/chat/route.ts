import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { query, sessionId } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Save User message
    await prisma.message.create({
      data: {
        content: query,
        role: "user",
        chatSessionId: sessionId,
      },
    });

    // Call the Python FastAPI server
    const pythonServerUrl = "http://localhost:8000/chat";
    const pythonResponse = await fetch(pythonServerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query, top_k: 2 }),
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python server responded with ${pythonResponse.status}`);
    }

    const responseData = await pythonResponse.json();
    const aiResponse = responseData.response;

    // Save AI message
    const aiDbMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        chatSessionId: sessionId,
      },
    });

    return NextResponse.json({ response: aiResponse, messageId: aiDbMessage.id });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
