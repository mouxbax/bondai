"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Check, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  completedAt: string | null;
  createdAt: string;
}

export function GoalList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const j = (await res.json()) as { goals: Goal[] };
        setGoals(j.goals);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchGoals(); }, [fetchGoals]);

  const addGoal = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setNewTitle("");
        await fetchGoals();
      }
    } finally {
      setAdding(false);
    }
  };

  const updateStatus = async (id: string, status: "COMPLETED" | "ABANDONED") => {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await fetchGoals();
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-stone-200/50 dark:bg-stone-800/30" />;
  }

  const active = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status === "COMPLETED");

  return (
    <div className="space-y-4">
      {/* Add goal */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a goal…"
          onKeyDown={(e) => { if (e.key === "Enter") void addGoal(); }}
          className="rounded-lg text-sm"
        />
        <Button onClick={() => void addGoal()} disabled={adding || !newTitle.trim()} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Active goals */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((g) => {
            const daysLeft = g.targetDate
              ? Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / 86400000)
              : null;
            return (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900/60"
              >
                <Target className="h-4 w-4 shrink-0 text-[#1D9E75]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                    {g.title}
                  </p>
                  {daysLeft !== null && (
                    <p className={`text-xs ${daysLeft < 0 ? "text-rose-500" : daysLeft < 7 ? "text-amber-500" : "text-stone-500"}`}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => void updateStatus(g.id, "COMPLETED")}
                    className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    title="Complete"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void updateStatus(g.id, "ABANDONED")}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Completed ({completed.length})
          </p>
          {completed.slice(0, 5).map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-500 line-through"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              {g.title}
            </div>
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <p className="text-sm text-stone-500 text-center py-4">
          No goals yet. Add one above to start tracking.
        </p>
      )}
    </div>
  );
}
