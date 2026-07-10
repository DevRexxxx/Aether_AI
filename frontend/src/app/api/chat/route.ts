import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { query, sessionId, model, temperature, maxTokens, systemPrompt } = await req.json();

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

    // Call the Python FastAPI server with optional settings overrides
    const pythonServerUrl = "http://localhost:8000/chat";
    const requestBody: Record<string, unknown> = { query, top_k: 2 };

    // Forward settings if provided
    if (model) requestBody.model = model;
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (maxTokens !== undefined) requestBody.max_tokens = maxTokens;
    if (systemPrompt) requestBody.system_prompt = systemPrompt;

    const pythonResponse = await fetch(pythonServerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
