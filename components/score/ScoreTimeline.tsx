"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function ScoreTimeline({ data }: { data: Array<{ at: string; score: number }> }) {
  const chartData = data.map((d) => ({
    t: new Date(d.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: d.score,
  }));

  return (
    <div className="h-64 w-full rounded-2xl border border-stone-100 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200 dark:stroke-stone-800" />
          <XAxis dataKey="t" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} width={32} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: "#e7e5e4",
              background: "var(--background)",
            }}
          />
          <Line type="monotone" dataKey="score" stroke="#1D9E75" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
