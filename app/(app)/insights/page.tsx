import { Header } from "@/components/layout/Header";
import { MoodChart } from "@/components/insights/MoodChart";

export const dynamic = "force-dynamic";

export default function InsightsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Mood Insights" />
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:px-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900/60">
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Last 30 days
          </h2>
          <MoodChart />
        </div>
        <p className="text-xs text-center text-stone-400">
          Mood is tagged automatically from your conversations with AIAH.
        </p>
      </div>
    </div>
  );
}
