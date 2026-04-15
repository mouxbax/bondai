/**
 * Skeleton for the chat conversation view — ghost message bubbles while
 * the server-rendered page resolves and the streaming connection warms up.
 */
export default function Loading() {
  const bubbles = [
    { role: "a", w: "w-2/3" },
    { role: "u", w: "w-1/2" },
    { role: "a", w: "w-4/5" },
    { role: "u", w: "w-2/5" },
    { role: "a", w: "w-3/5" },
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#FAFAF8] dark:bg-[#0f1412]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-4 pt-6">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className={`flex ${b.role === "u" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`h-12 ${b.w} animate-pulse rounded-3xl ${
                b.role === "u"
                  ? "bg-[#1D9E75]/30"
                  : "bg-stone-200/80 dark:bg-stone-800/70"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mx-auto mb-3 w-full max-w-3xl px-3">
        <div className="h-12 w-full animate-pulse rounded-3xl bg-white/70 shadow-sm dark:bg-stone-800/60" />
      </div>
    </div>
  );
}
