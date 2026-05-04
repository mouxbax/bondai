/**
 * Skeleton for the Companion page.
 * Ghost orb + inventory grid while companion data loads.
 */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-6">
      {/* Header placeholder */}
      <div className="h-8 w-40 animate-pulse rounded-lg bg-stone-200/80 dark:bg-stone-800/60 mb-6" />

      {/* Orb + name */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-36 w-36 animate-pulse rounded-full bg-gradient-to-br from-[#1D9E75]/15 to-emerald-400/10 mb-3" />
        <div className="h-5 w-24 animate-pulse rounded-md bg-stone-200/80 dark:bg-stone-800/60" />
      </div>

      {/* Evolution bar */}
      <div className="h-3 w-full animate-pulse rounded-full bg-stone-200/70 dark:bg-stone-800/50 mb-8" />

      {/* Inventory grid */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-stone-200/60 dark:bg-stone-800/40"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
