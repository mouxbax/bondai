"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { SocialGoal } from "@prisma/client";

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<SocialGoal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    if (!res.ok) {
      setError("Could not load goals.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { goals: SocialGoal[] };
    setGoals(data.goals);
    setLoading(false);
    setError(null);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!title.trim() || !description.trim()) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    });
    if (!res.ok) return;
    setTitle("");
    setDescription("");
    await load();
  };

  const complete = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (!res.ok) return;
    void confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
    await load();
  };

  const abandon = async (id: string) => {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ABANDONED" }),
    });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Social goals" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 md:px-8">
        <Card className="border-stone-100 dark:border-stone-800">
          <CardHeader>
            <CardTitle className="text-base">New goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What would success look like?" />
            <Button className="rounded-xl" type="button" onClick={() => void create()}>
              Add goal
            </Button>
          </CardContent>
        </Card>

        {loading ? <p className="text-sm text-stone-500">Loading…</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="space-y-3">
          {goals.length === 0 && !loading ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">No goals yet — add your first tiny step.</p>
          ) : null}
          {goals.map((g) => (
            <Card key={g.id} className="border-stone-100 dark:border-stone-800">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{g.title}</CardTitle>
                <Badge variant={g.status === "COMPLETED" ? "amber" : "secondary"}>{g.status.toLowerCase()}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-stone-600 dark:text-stone-300">{g.description}</p>
                <div className="flex flex-wrap gap-2">
                  {g.status === "ACTIVE" ? (
                    <>
                      <Button size="sm" className="rounded-xl" type="button" onClick={() => void complete(g.id)}>
                        Mark complete
                      </Button>
                      <Button size="sm" variant="secondary" className="rounded-xl" type="button" onClick={() => void abandon(g.id)}>
                        Pause
                      </Button>
                    </>
                  ) : null}
                  <Button size="sm" variant="ghost" className="rounded-xl" type="button" onClick={() => void remove(g.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
