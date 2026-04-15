import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * POST /api/transcribe
 * Body: multipart/form-data with an "audio" blob (webm/ogg/mp4).
 * Returns: { text: string }
 *
 * Uses OpenAI Whisper. Requires OPENAI_API_KEY. We hit OpenAI directly
 * because OpenRouter does not consistently proxy audio endpoints.
 * Optional: set WHISPER_MODEL (default: "whisper-1"). For lower cost,
 * use OPENAI_BASE_URL to point at Groq ("https://api.groq.com/openai/v1")
 * with a Groq key — their free tier serves Whisper-large-v3.
 */
export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Voice transcription is not configured. Set OPENAI_API_KEY (or GROQ_API_KEY with OPENAI_BASE_URL).",
      },
      { status: 503 },
    );
  }

  const baseURL =
    process.env.OPENAI_BASE_URL ??
    (process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY
      ? "https://api.groq.com/openai/v1"
      : "https://api.openai.com/v1");

  const model =
    process.env.WHISPER_MODEL ??
    (process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY ? "whisper-large-v3" : "whisper-1");

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = incoming.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing 'audio' blob." }, { status: 400 });
  }

  // Rough ceiling to prevent runaway costs / abuse. 25 MB matches Whisper's limit.
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large (max 25 MB)." }, { status: 413 });
  }

  const upstream = new FormData();
  // Name is required by the API; choose extension from MIME.
  const ext =
    file.type.includes("webm") ? "webm" :
    file.type.includes("ogg") ? "ogg" :
    file.type.includes("mp4") || file.type.includes("m4a") ? "m4a" :
    file.type.includes("wav") ? "wav" :
    "webm";
  upstream.append("file", file, `speech.${ext}`);
  upstream.append("model", model);
  const language = (incoming.get("language") as string | null) ?? undefined;
  if (language) upstream.append("language", language);
  upstream.append("response_format", "json");
  upstream.append("temperature", "0");

  let res: Response;
  try {
    res = await fetch(`${baseURL}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the transcription service." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      {
        error: "Transcription failed.",
        status: res.status,
        detail: detail.slice(0, 300),
      },
      { status: 502 },
    );
  }

  const json = (await res.json().catch(() => null)) as { text?: string } | null;
  const text = (json?.text ?? "").trim();
  return NextResponse.json({ text });
}

export const runtime = "nodejs";
// Never cache; every call has unique audio.
export const dynamic = "force-dynamic";
