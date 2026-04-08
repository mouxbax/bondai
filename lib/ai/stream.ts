import type { OpenAI } from "openai";

export interface SseChunk {
  type: "text" | "meta";
  text?: string;
  meta?: Record<string, unknown>;
}

function encoder(): TextEncoder {
  return new TextEncoder();
}

export function sseData(obj: Record<string, unknown>): Uint8Array {
  return encoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

export function createChatReadableStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): ReadableStream<Uint8Array> {
  const enc = encoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "text", text: delta })}\n\n`));
          }
        }
        controller.close();
      } catch (e) {
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ type: "error", message: e instanceof Error ? e.message : "stream error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}
