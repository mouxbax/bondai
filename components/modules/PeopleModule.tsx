"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMood } from "@/lib/mood-context";
import {
  addRelationship,
  deleteRelationship,
  getRelationships,
  markContacted,
  type Relationship,
} from "@/lib/life-storage";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { useCelebrate } from "@/components/fx/Celebration";

const roles = ["Friend", "Family", "Partner", "Colleague", "Mentor", "Other"];
const emojiPool = ["👤", "💙", "👨‍👩‍👧", "🤝", "🌟", "💫", "🧡", "🫂"];

function daysAgo(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function PeopleModule() {
  const { theme } = useMood();
  const celebrate = useCelebrate();
  const [people, setPeople] = useState<Relationship[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState(roles[0]);
  const [emoji, setEmoji] = useState(emojiPool[0]);
  const [reminderDays, setReminderDays] = useState(14);

  useEffect(() => {
    setPeople(getRelationships());
  }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    addRelationship({ name: name.trim(), role, emoji, reminderDays });
    setPeople(getRelationships());
    setName("");
    setRole(roles[0]);
    setEmoji(emojiPool[0]);
    setReminderDays(14);
    setShowForm(false);
  };

  const handleContacted = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setPeople(markContacted(id));
    const rect = e.currentTarget.getBoundingClientRect();
    const result = awardXP("person_contacted");
    const newAch = checkAchievements();
    celebrate(
      result,
      newAch.map((a) => ({ emoji: a.emoji, name: a.name, description: a.description })),
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
  };

  const handleDelete = (id: string) => {
    setPeople(deleteRelationship(id));
  };

  // Sort: overdue first, then by days since contact
  const sorted = [...people].sort((a, b) => {
    const da = daysAgo(a.lastContact) ?? 9999;
    const db = daysAgo(b.lastContact) ?? 9999;
    const oa = da - a.reminderDays;
    const ob = db - b.reminderDays;
    return ob - oa;
  });

  return (
    <div className={`relative flex flex-1 flex-col bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${theme.text}`}>Your circle</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>Nurture the relationships that fuel your growth.</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} className="rounded-xl">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 rounded-2xl bg-white/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-stone-900/60">
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
                <div className="flex flex-wrap gap-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        role === r
                          ? "border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                          : "border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {emojiPool.map((em) => (
                    <button
                      key={em}
                      onClick={() => setEmoji(em)}
                      className={`rounded-lg px-2 py-1 text-lg ${
                        emoji === em ? "bg-stone-900 dark:bg-stone-50" : "hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div>
                  <label className={`text-xs ${theme.textMuted}`}>Remind me every {reminderDays} days</label>
                  <input
                    type="range"
                    min={3}
                    max={90}
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} className="rounded-xl">
                    Add person
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 space-y-2">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700">
              <p className={`text-sm ${theme.text}`}>No one added yet.</p>
              <p className={`mt-1 text-xs ${theme.textMuted}`}>Add the 5 people in your inner circle.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sorted.map((p) => {
                const d = daysAgo(p.lastContact);
                const overdue = d !== null && d >= p.reminderDays;
                const never = d === null;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex items-center gap-3 rounded-2xl border p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl ${
                      overdue
                        ? "border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-950/40"
                        : "border-stone-100 bg-white/80 dark:bg-stone-900/60"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-xl dark:bg-stone-800">
                      {p.emoji ?? "👤"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className={`truncate text-sm font-medium ${theme.text}`}>{p.name}</p>
                        <span className={`text-xs ${theme.textMuted}`}>{p.role}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3 text-stone-400" />
                        <span className={overdue ? "text-amber-600 dark:text-amber-400" : theme.textMuted}>
                          {never
                            ? "Never contacted"
                            : d === 0
                              ? "Contacted today"
                              : `${d}d ago`}
                          {overdue && " - reach out"}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => handleContacted(p.id, e)}
                      className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                    >
                      <MessageCircle className="h-3 w-3" /> Done
                    </motion.button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-red-500 dark:hover:bg-stone-800"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        <div className="h-24" />
      </div>
    </div>
  );
}
