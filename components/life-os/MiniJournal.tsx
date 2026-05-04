"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MiniJournal() {
  const [entry, setEntry] = useState("");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const storageKey = `aiah-journal-${getTodayKey()}`;

  // Load entry for today
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setEntry(stored);
    }
    setLoaded(true);
  }, [storageKey]);

  const saveEntry = () => {
    localStorage.setItem(storageKey, entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-600 dark:text-stone-400">
          Today's note
        </label>
        {saved && <span className="text-xs text-emerald-500">Saved</span>}
      </div>
      <Textarea
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        placeholder="How are you feeling today? What's on your mind?"
        className="rounded-lg min-h-24 text-xs resize-none"
      />
      <Button
        size="sm"
        onClick={saveEntry}
        className="rounded-lg text-xs h-7"
      >
        Save
      </Button>
    </div>
  );
}
