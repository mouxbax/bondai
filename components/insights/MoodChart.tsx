"use client";

import { useEffect, useState } from "react";

const EMOTIONS: Record<string, { color: string; label: string }> = {
  HAPPY: { color: "#34d399", label: "Happy" },
  SAD: { color: "#60a5fa", label: "Sad" },
  ANXIOUS: { color: "#fbbf24", label: "Anxious" },
  LONELY: { color: "#a78bfa", label: "Lonely" },
  ANGRY: { color: "#f87171", label: "Angry" },
  NEUTRAL: { color: "#94a3b8", label: "Neutral" },
};

interface DayData {
  date: string;
  [key: string]: string | number;
}

interface MoodData {
  days: DayData[];
  totals: Record<string, number>;
  count: number;
}

export function MoodChart() {
  const [data, setData] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/mood")
      .then((r) => r.json())
      .then((j) => setData(j as MoodData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-xl bg-stone-200/50 dark:bg-stone-800/30" />
    );
  }

  if (!data || data.count === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center dark:border-stone-800 dark:bg-stone-900/40">
        <p className="text-sm text-stone-500">
          No mood data yet. Start chatting with AIAH and your patterns will appear here.
        </p>
      </div>
    );
  }

  const maxPerDay = Math.max(
    ...data.days.map((d) =>
      Object.keys(EMOTIONS).reduce((sum, k) => sum + (Number(d[k]) || 0), 0),
    ),
    1,
  );

  return (
    <div className="space-y-4">
      {/* Bar chart */}
      <div className="flex items-end gap-1 h-32">
        {data.days.map((day) => {
          const total = Object.keys(EMOTIONS).reduce(
            (sum, k) => sum + (Number(day[k]) || 0),
            0,
          );
          const heightPct = (total / maxPerDay) * 100;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col justify-end min-w-0"
              title={`${day.date}: ${total} logs`}
            >
              <div
                className="w-full rounded-t-sm overflow-hidden"
                style={{ height: `${heightPct}%` }}
              >
                {Object.entries(EMOTIONS).map(([key, { color }]) => {
                  const val = Number(day[key]) || 0;
                  if (val === 0) return null;
                  const segPct = (val / total) * 100;
                  return (
                    <div
                      key={key}
                      style={{ height: `${segPct}%`, backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EMOTIONS).map(([key, { color, label }]) => {
          const total = data.totals[key] || 0;
          if (total === 0) return null;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-stone-600 dark:text-stone-400">
                {label} ({total})
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {data.count > 0 && (
        <p className="text-xs text-stone-500">
          {data.count} mood readings over {data.days.length} days
        </p>
      )}
    </div>
  );
}
