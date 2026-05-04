/**
 * Skeleton for the Account page.
 * Ghost form cards while profile data loads.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-stone-200 dark:border-stone-800 p-5"
        >
          <div
            className="h-5 w-28 animate-pulse rounded bg-stone-200/80 dark:bg-stone-800/60 mb-4"
            style={{ animationDelay: `${i * 100}ms` }}
          />
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded-lg bg-stone-200/50 dark:bg-stone-800/30" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-stone-200/50 dark:bg-stone-800/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
