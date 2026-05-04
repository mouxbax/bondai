/**
 * Skeleton for the Home / Companion dashboard.
 * Shows ghost orb + stat badges + greeting area while data loads.
 */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-4 pt-8">
      {/* Orb placeholder */}
      <div className="relative mb-6">
        <div className="h-48 w-48 animate-pulse rounded-full bg-gradient-to-br from-[#1D9E75]/20 to-emerald-400/10" />
        <div className="absolute inset-6 rounded-full bg-[#fafaf8] dark:bg-[#0f1412]" />
      </div>

      {/* Stat badges row */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-stone-200/80 dark:bg-stone-800/60"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* Greeting / speech bubble */}
      <div className="h-16 w-64 animate-pulse rounded-2xl bg-stone-200/60 dark:bg-stone-800/40 mb-4" />

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <div className="h-12 w-28 animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/50" />
        <div className="h-12 w-28 animate-pulse rounded-xl bg-stone-200/70 dark:bg-stone-800/50" />
      </div>
    </div>
  );
}
