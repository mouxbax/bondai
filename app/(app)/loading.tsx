export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full bg-[#1D9E75]/20 blur-xl" />
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-[#1D9E75] to-emerald-400 opacity-80" />
        <div className="absolute inset-2 rounded-full bg-[#fafaf8] dark:bg-[#0f1412]" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#1D9E75]"
          style={{ animationDuration: "1.2s" }}
        />
      </div>
    </div>
  );
}
