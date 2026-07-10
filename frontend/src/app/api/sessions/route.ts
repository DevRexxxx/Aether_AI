import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const chatSessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(chatSessions);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    const newSession = await prisma.chatSession.create({
      data: {
        title: title || "New Chat",
      },
    });

    return NextResponse.json(newSession);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
