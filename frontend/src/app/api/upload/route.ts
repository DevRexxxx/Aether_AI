import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Forward the file to the Python FastAPI backend
    const pythonServerUrl = "http://localhost:8000/parse_document";
    
    // We create a new FormData to send to the Python server
    const backendFormData = new FormData();
    backendFormData.append("file", file, file.name);

    const pythonResponse = await fetch(pythonServerUrl, {
      method: "POST",
      body: backendFormData,
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      throw new Error(`Python server responded with ${pythonResponse.status}: ${errorText}`);
    }

    const responseData = await pythonResponse.json();
    return NextResponse.json({ text: responseData.text });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
