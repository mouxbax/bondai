import { NextResponse } from "next/server";
import { getOpenRouterClient, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint - hit /api/health/ai in a browser (or via curl) to
 * verify that OpenRouter is reachable with the configured key. Returns JSON
 * describing which env vars are missing and whether a tiny completion works.
 *
 * This is the first thing to check when the chat flow silently fails.
 */
export async function GET() {
  const hasKey = Boolean(process.env.OPENROUTER_API_KEY);
  const hasBase = Boolean(process.env.OPENROUTER_BASE_URL);
  const hasDb = Boolean(process.env.DATABASE_URL);
  const hasAuth = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);

  if (!hasKey) {
    return NextResponse.json(
      {
        ok: false,
        env: { OPENROUTER_API_KEY: false, OPENROUTER_BASE_URL: hasBase, DATABASE_URL: hasDb, AUTH_SECRET: hasAuth },
        reason: "OPENROUTER_API_KEY is not set. Add it to .env.local (local) or your Vercel environment variables (deployed).",
      },
      { status: 500 },
    );
  }

  const tryModel = async (model: string) => {
    const client = getOpenRouterClient();
    const started = Date.now();
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Respond with exactly the word: ok" },
        { role: "user", content: "ping" },
      ],
      max_tokens: 8,
      temperature: 0,
    });
    const took = Date.now() - started;
    return { model, took, reply: res.choices[0]?.message?.content ?? null };
  };

  try {
    const result = await tryModel(PRIMARY_MODEL);
    return NextResponse.json({
      ok: true,
      env: { OPENROUTER_API_KEY: true, OPENROUTER_BASE_URL: hasBase, DATABASE_URL: hasDb, AUTH_SECRET: hasAuth },
      primary: result,
    });
  } catch (e) {
    const primaryError = e instanceof Error ? e.message : String(e);
    try {
      const result = await tryModel(FALLBACK_MODEL);
      return NextResponse.json({
        ok: true,
        env: { OPENROUTER_API_KEY: true, OPENROUTER_BASE_URL: hasBase, DATABASE_URL: hasDb, AUTH_SECRET: hasAuth },
        primaryError,
        fallback: result,
      });
    } catch (e2) {
      const fallbackError = e2 instanceof Error ? e2.message : String(e2);
      return NextResponse.json(
        {
          ok: false,
          env: { OPENROUTER_API_KEY: true, OPENROUTER_BASE_URL: hasBase, DATABASE_URL: hasDb, AUTH_SECRET: hasAuth },
          primaryError,
          fallbackError,
          reason:
            "Both models failed. Most common causes: wrong API key, no OpenRouter credits, or outbound network is blocked.",
        },
        { status: 502 },
      );
    }
  }
}
