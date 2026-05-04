/**
 * Skeleton for the Plans / Life OS hub.
 * Ghost progress bar + day cards while plan data loads.
 */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-6">
      {/* Header */}
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200/80 dark:bg-stone-800/60 mb-4" />

      {/* Progress bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 mb-6">
        <div className="h-4 w-32 animate-pulse rounded bg-stone-200/80 dark:bg-stone-800/60 mb-3" />
        <div className="h-2 w-full animate-pulse rounded-full bg-stone-200/70 dark:bg-stone-800/50" />
      </div>

      {/* Day cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="mb-3 rounded-xl border border-stone-200 dark:border-stone-800 p-4"
        >
          <div
            className="h-5 w-24 animate-pulse rounded bg-stone-200/80 dark:bg-stone-800/60 mb-3"
            style={{ animationDelay: `${i * 80}ms` }}
          />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-stone-200/50 dark:bg-stone-800/30" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-stone-200/50 dark:bg-stone-800/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
