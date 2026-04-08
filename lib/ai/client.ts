import OpenAI from "openai";

const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const apiKey = process.env.OPENROUTER_API_KEY ?? "";

/** Primary model with OpenRouter fallback naming. */
export const PRIMARY_MODEL = "qwen/qwen3-235b-a22b";
export const FALLBACK_MODEL = "qwen/qwq-32b";

export function getOpenRouterClient(): OpenAI {
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      "X-Title": "BondAI",
    },
  });
}

export async function chatCompletionJson<T>(
  system: string,
  user: string,
  options?: { model?: string; maxTokens?: number }
): Promise<T> {
  const client = getOpenRouterClient();
  const model = options?.model ?? PRIMARY_MODEL;
  const maxTokens = options?.maxTokens ?? 256;

  async function run(m: string): Promise<T> {
    const res = await client.chat.completions.create({
      model: m,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(text) as T;
  }

  try {
    return await run(model);
  } catch {
    return await run(FALLBACK_MODEL);
  }
}
