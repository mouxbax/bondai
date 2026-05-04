/**
 * Skeleton for the Chat list page.
 * Ghost conversation rows while history loads.
 */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-6">
      <div className="h-8 w-36 animate-pulse rounded-lg bg-stone-200/80 dark:bg-stone-800/60 mb-6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3 border-b border-stone-100 dark:border-stone-800/50"
        >
          <div
            className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-stone-200/80 dark:bg-stone-800/60"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200/80 dark:bg-stone-800/60" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200/50 dark:bg-stone-800/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
