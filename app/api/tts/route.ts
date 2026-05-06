import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOpenAIClient } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const text = body?.text;
  if (!text || typeof text !== "string" || text.length > 4096) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }

  try {
    const openai = getOpenAIClient();
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      speed: 1.05, // slightly faster for snappier feel
    });

    // Stream the TTS audio directly instead of buffering the entire response.
    // This lets the client start playing while bytes are still arriving.
    const audioStream = mp3.body;
    if (!audioStream) {
      return NextResponse.json({ error: "No audio body" }, { status: 500 });
    }

    return new Response(audioStream as ReadableStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("[TTS_ERROR]", err);
    return NextResponse.json(
      { error: "TTS failed" },
      { status: 500 }
    );
  }
}
