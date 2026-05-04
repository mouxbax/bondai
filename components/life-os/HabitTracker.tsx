"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface StoredHabits {
  habits: string[];
  tracked: Record<string, Record<string, boolean>>; // {habitName: {dayKey: boolean}}
}

export function HabitTracker() {
  const [habits, setHabits] = useState<string[]>([]);
  const [tracked, setTracked] = useState<Record<string, Record<string, boolean>>>({});
  const [newHabit, setNewHabit] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Get today's day key
  const getTodayKey = () => {
    const today = new Date();
    const dayIndex = today.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sun=0 to Mon=0
    return DAY_KEYS[adjustedIndex];
  };

  const todayKey = getTodayKey();

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("aiah-habits");
    if (stored) {
      try {
        const parsed: StoredHabits = JSON.parse(stored);
        setHabits(parsed.habits || []);
        setTracked(parsed.tracked || {});
      } catch {
        setHabits([]);
        setTracked({});
      }
    }
    setLoaded(true);
  }, []);

  // Save to localStorage
  const save = (newHabits: string[], newTracked: Record<string, Record<string, boolean>>) => {
    localStorage.setItem(
      "aiah-habits",
      JSON.stringify({
        habits: newHabits,
        tracked: newTracked,
      })
    );
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const updated = [...habits, newHabit.trim()];
    const newTracked = {
      ...tracked,
      [newHabit.trim()]: {},
    };
    setHabits(updated);
    setTracked(newTracked);
    setNewHabit("");
    save(updated, newTracked);
  };

  const removeHabit = (habit: string) => {
    const updated = habits.filter((h) => h !== habit);
    const newTracked = { ...tracked };
    delete newTracked[habit];
    setHabits(updated);
    setTracked(newTracked);
    save(updated, newTracked);
  };

  const toggleDay = (habit: string, day: string) => {
    const newTracked = {
      ...tracked,
      [habit]: {
        ...tracked[habit],
        [day]: !tracked[habit]?.[day],
      },
    };
    setTracked(newTracked);
    save(habits, newTracked);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-3">
      {/* Add new habit */}
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add a habit…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addHabit();
            }
          }}
          className="rounded-lg text-xs h-8"
        />
        <Button
          size="sm"
          onClick={addHabit}
          className="rounded-lg h-8"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Day headers */}
      {habits.length > 0 && (
        <div className="grid gap-2">
          <div className="grid grid-cols-8 gap-1 text-[10px] font-semibold text-stone-500">
            <div className="pr-2"></div>
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`text-center ${DAY_KEYS[i] === todayKey ? "text-emerald-600" : ""}`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Habit rows */}
          {habits.map((habit) => (
            <div key={habit} className="grid grid-cols-8 gap-1 items-center">
              <div className="flex items-center gap-1 pr-2">
                <button
                  onClick={() => removeHabit(habit)}
                  className="text-stone-400 hover:text-rose-500 flex-shrink-0"
                  title="Remove habit"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {DAY_KEYS.map((day) => {
                const isChecked = tracked[habit]?.[day] || false;
                const isToday = day === todayKey;

                return (
                  <button
                    key={`${habit}-${day}`}
                    onClick={() => toggleDay(habit, day)}
                    className={`h-7 rounded transition-all ${
                      isChecked
                        ? "bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-600"
                        : isToday
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700"
                          : "bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    }`}
                    title={`${habit} - ${day}`}
                  >
                    {isChecked && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {habits.length === 0 && (
        <p className="text-xs text-stone-500 italic">Add a habit to track your progress.</p>
      )}
    </div>
  );
}
