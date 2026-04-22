"use client";

import * as React from "react";
import { ChevronDown, Save, Loader2, Check, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LifeOsData } from "@/lib/life-os/types";

/**
 * Sectioned, auto-saving-on-click form for the user's Life OS profile.
 * Collapsible sections so it doesn't feel overwhelming on first visit.
 */

type SaveState = "idle" | "saving" | "saved" | "error";

function num(v: string): number | undefined {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

function intNum(v: string): number | undefined {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function Section({
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CardHeader>
      </button>
      {open && <CardContent className="space-y-3">{children}</CardContent>}
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-stone-500">{label}</Label>
      {children}
    </div>
  );
}

export function LifeOsForm({
  initial,
  onSaved,
}: {
  initial: LifeOsData;
  onSaved?: (data: LifeOsData) => void;
}) {
  const [data, setData] = React.useState<LifeOsData>(initial);
  const [state, setState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const patch = <K extends keyof LifeOsData>(key: K, value: LifeOsData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const save = async () => {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/life-os", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Save failed");
      }
      const j = (await res.json()) as { profile: LifeOsData };
      setState("saved");
      onSaved?.(j.profile);
      setTimeout(() => setState("idle"), 1800);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  // ─── Projects array helpers ────────────────────────────────────────────
  const projects = data.projects ?? [];
  const addProject = () =>
    patch("projects", [...projects, { name: "", description: "", weeklyHoursTarget: 0 }]);
  const updateProject = (i: number, patchP: Partial<NonNullable<LifeOsData["projects"]>[number]>) =>
    patch(
      "projects",
      projects.map((p, idx) => (idx === i ? { ...p, ...patchP } : p)),
    );
  const removeProject = (i: number) =>
    patch("projects", projects.filter((_, idx) => idx !== i));

  // ─── Year goals helpers ────────────────────────────────────────────────
  const yearGoals = data.yearGoals ?? [];
  const addYearGoal = () => patch("yearGoals", [...yearGoals, { title: "" }]);
  const updateYearGoal = (i: number, p: Partial<NonNullable<LifeOsData["yearGoals"]>[number]>) =>
    patch(
      "yearGoals",
      yearGoals.map((g, idx) => (idx === i ? { ...g, ...p } : g)),
    );
  const removeYearGoal = (i: number) =>
    patch("yearGoals", yearGoals.filter((_, idx) => idx !== i));

  // ─── Rules helpers ─────────────────────────────────────────────────────
  const rules = data.rules ?? {};
  const nonNegs = rules.nonNegotiables ?? [];
  const hardStops = rules.hardStops ?? [];
  const setRule = (k: "nonNegotiables" | "hardStops", arr: string[]) =>
    patch("rules", { ...rules, [k]: arr });

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Section title="Identity" hint="Who you are right now" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name">
            <Input
              value={data.identity?.name ?? ""}
              onChange={(e) => patch("identity", { ...data.identity, name: e.target.value })}
            />
          </Field>
          <Field label="Age">
            <Input
              type="number"
              value={data.identity?.age ?? ""}
              onChange={(e) =>
                patch("identity", { ...data.identity, age: intNum(e.target.value) })
              }
            />
          </Field>
          <Field label="Location">
            <Input
              value={data.identity?.location ?? ""}
              onChange={(e) => patch("identity", { ...data.identity, location: e.target.value })}
            />
          </Field>
          <Field label="Wake time">
            <Input
              placeholder="08:00"
              value={data.identity?.wakeTime ?? ""}
              onChange={(e) => patch("identity", { ...data.identity, wakeTime: e.target.value })}
            />
          </Field>
          <Field label="Sleep time">
            <Input
              placeholder="23:00"
              value={data.identity?.sleepTime ?? ""}
              onChange={(e) => patch("identity", { ...data.identity, sleepTime: e.target.value })}
            />
          </Field>
          <Field label="Current weight (kg)">
            <Input
              type="number"
              value={data.identity?.currentWeightKg ?? ""}
              onChange={(e) =>
                patch("identity", { ...data.identity, currentWeightKg: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Height (cm)">
            <Input
              type="number"
              value={data.identity?.heightCm ?? ""}
              onChange={(e) =>
                patch("identity", { ...data.identity, heightCm: num(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Short bio — what are you doing this year?">
          <Textarea
            rows={3}
            value={data.identity?.shortBio ?? ""}
            onChange={(e) => patch("identity", { ...data.identity, shortBio: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Year goals" hint="The 3–6 outcomes that define this year">
        <div className="space-y-3">
          {yearGoals.map((g, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
              <div className="md:col-span-3">
                <Field label="Goal">
                  <Input
                    value={g.title}
                    onChange={(e) => updateYearGoal(i, { title: e.target.value })}
                    placeholder="Pay off ~13,000€ debt"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Metric">
                  <Input
                    value={g.metric ?? ""}
                    onChange={(e) => updateYearGoal(i, { metric: e.target.value })}
                    placeholder="-13,000€ or 85kg"
                  />
                </Field>
              </div>
              <div className="flex gap-2">
                <Input
                  value={g.deadline ?? ""}
                  onChange={(e) => updateYearGoal(i, { deadline: e.target.value })}
                  placeholder="Dec 2026"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeYearGoal(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addYearGoal} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add goal
          </Button>
        </div>
      </Section>

      <Section title="Finances" hint="Income, fixed costs, debt — drives money blocks in your week">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Monthly income (€)">
            <Input
              type="number"
              value={data.finances?.monthlyIncomeEUR ?? ""}
              onChange={(e) =>
                patch("finances", { ...data.finances, monthlyIncomeEUR: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Monthly fixed expenses (€)">
            <Input
              type="number"
              value={data.finances?.monthlyFixedExpensesEUR ?? ""}
              onChange={(e) =>
                patch("finances", {
                  ...data.finances,
                  monthlyFixedExpensesEUR: num(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Monthly food budget (€)">
            <Input
              type="number"
              value={data.finances?.monthlyFoodEUR ?? ""}
              onChange={(e) =>
                patch("finances", { ...data.finances, monthlyFoodEUR: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Total debt (€)">
            <Input
              type="number"
              value={data.finances?.totalDebtEUR ?? ""}
              onChange={(e) =>
                patch("finances", { ...data.finances, totalDebtEUR: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Debt payoff target">
            <Input
              value={data.finances?.debtPayoffTarget ?? ""}
              onChange={(e) =>
                patch("finances", { ...data.finances, debtPayoffTarget: e.target.value })
              }
              placeholder="December 2026"
            />
          </Field>
          <Field label="Monthly savings goal (€)">
            <Input
              type="number"
              value={data.finances?.monthlySavingsGoalEUR ?? ""}
              onChange={(e) =>
                patch("finances", {
                  ...data.finances,
                  monthlySavingsGoalEUR: num(e.target.value),
                })
              }
            />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea
            rows={2}
            value={data.finances?.notes ?? ""}
            onChange={(e) => patch("finances", { ...data.finances, notes: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Weekly schedule" hint="What's fixed in each day — the planner works around this">
        {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map(
          (d) => (
            <Field key={d} label={d}>
              <Textarea
                rows={3}
                placeholder="e.g. 09:00-18:00 work, 18:30 gym, 23:00 sleep"
                value={data.weeklySchedule?.[d] ?? ""}
                onChange={(e) =>
                  patch("weeklySchedule", { ...data.weeklySchedule, [d]: e.target.value })
                }
              />
            </Field>
          ),
        )}
      </Section>

      <Section title="Fitness" hint="Goal, split, volume">
        <Field label="Goal">
          <Input
            value={data.fitness?.goal ?? ""}
            onChange={(e) => patch("fitness", { ...data.fitness, goal: e.target.value })}
            placeholder="Lean athletic, 85kg by July"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Split">
            <Input
              value={data.fitness?.split ?? ""}
              onChange={(e) => patch("fitness", { ...data.fitness, split: e.target.value })}
              placeholder="Push/Pull/Legs"
            />
          </Field>
          <Field label="Sessions / week">
            <Input
              type="number"
              value={data.fitness?.sessionsPerWeek ?? ""}
              onChange={(e) =>
                patch("fitness", { ...data.fitness, sessionsPerWeek: intNum(e.target.value) })
              }
            />
          </Field>
          <Field label="Cardio / week">
            <Input
              type="number"
              value={data.fitness?.cardioPerWeek ?? ""}
              onChange={(e) =>
                patch("fitness", { ...data.fitness, cardioPerWeek: intNum(e.target.value) })
              }
            />
          </Field>
          <Field label="Daily steps target">
            <Input
              type="number"
              value={data.fitness?.stepsTarget ?? ""}
              onChange={(e) =>
                patch("fitness", { ...data.fitness, stepsTarget: intNum(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea
            rows={2}
            value={data.fitness?.notes ?? ""}
            onChange={(e) => patch("fitness", { ...data.fitness, notes: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Diet" hint="Fuel for everything above">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="kcal / day">
            <Input
              type="number"
              value={data.diet?.kcalTarget ?? ""}
              onChange={(e) => patch("diet", { ...data.diet, kcalTarget: intNum(e.target.value) })}
            />
          </Field>
          <Field label="Protein (g)">
            <Input
              type="number"
              value={data.diet?.proteinTargetG ?? ""}
              onChange={(e) =>
                patch("diet", { ...data.diet, proteinTargetG: intNum(e.target.value) })
              }
            />
          </Field>
          <Field label="Weekly grocery budget (€)">
            <Input
              type="number"
              value={data.diet?.weeklyBudgetEUR ?? ""}
              onChange={(e) =>
                patch("diet", { ...data.diet, weeklyBudgetEUR: num(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Approach">
          <Input
            value={data.diet?.approach ?? ""}
            onChange={(e) => patch("diet", { ...data.diet, approach: e.target.value })}
            placeholder="fat-loss / maintain / bulk"
          />
        </Field>
        <Field label="Meal prep day">
          <Input
            value={data.diet?.mealPrepDay ?? ""}
            onChange={(e) => patch("diet", { ...data.diet, mealPrepDay: e.target.value })}
            placeholder="Sunday"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            rows={2}
            value={data.diet?.notes ?? ""}
            onChange={(e) => patch("diet", { ...data.diet, notes: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Income growth" hint="Freelance / business targets">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Current monthly (€)">
            <Input
              type="number"
              value={data.income?.currentMonthlyEUR ?? ""}
              onChange={(e) =>
                patch("income", { ...data.income, currentMonthlyEUR: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Target monthly (€)">
            <Input
              type="number"
              value={data.income?.targetMonthlyEUR ?? ""}
              onChange={(e) =>
                patch("income", { ...data.income, targetMonthlyEUR: num(e.target.value) })
              }
            />
          </Field>
          <Field label="Weekly outreach target">
            <Input
              type="number"
              value={data.income?.weeklyOutreachTarget ?? ""}
              onChange={(e) =>
                patch("income", { ...data.income, weeklyOutreachTarget: intNum(e.target.value) })
              }
            />
          </Field>
          <Field label="Weekly content target">
            <Input
              type="number"
              value={data.income?.weeklyContentTarget ?? ""}
              onChange={(e) =>
                patch("income", { ...data.income, weeklyContentTarget: intNum(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Primary offer">
          <Textarea
            rows={2}
            value={data.income?.primaryOffer ?? ""}
            onChange={(e) => patch("income", { ...data.income, primaryOffer: e.target.value })}
            placeholder="Digital marketing + AI automation for Paris SMEs"
          />
        </Field>
        <Field label="Pricing">
          <Input
            value={data.income?.pricing ?? ""}
            onChange={(e) => patch("income", { ...data.income, pricing: e.target.value })}
            placeholder="1500–4000€/project or 800€/mo retainer"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            rows={2}
            value={data.income?.notes ?? ""}
            onChange={(e) => patch("income", { ...data.income, notes: e.target.value })}
          />
        </Field>
      </Section>

      <Section title="Projects" hint="Anything else you're building — Bondai, music, a course…">
        <div className="space-y-3">
          {projects.map((p, i) => (
            <div key={i} className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={p.name}
                  onChange={(e) => updateProject(i, { name: e.target.value })}
                  placeholder="Project name"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProject(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                rows={2}
                value={p.description ?? ""}
                onChange={(e) => updateProject(i, { description: e.target.value })}
                placeholder="What is it, who's it for"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Field label="Weekly hours">
                  <Input
                    type="number"
                    value={p.weeklyHoursTarget ?? ""}
                    onChange={(e) =>
                      updateProject(i, { weeklyHoursTarget: num(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Next milestone">
                  <Input
                    value={p.nextMilestone ?? ""}
                    onChange={(e) => updateProject(i, { nextMilestone: e.target.value })}
                  />
                </Field>
                <Field label="Deadline">
                  <Input
                    value={p.deadline ?? ""}
                    onChange={(e) => updateProject(i, { deadline: e.target.value })}
                    placeholder="Sept 2026"
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addProject} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add project
          </Button>
        </div>
      </Section>

      <Section title="Rules" hint="Non-negotiables and hard stops — the planner enforces these">
        <Field label="Non-negotiables (one per line)">
          <Textarea
            rows={4}
            value={nonNegs.join("\n")}
            onChange={(e) =>
              setRule(
                "nonNegotiables",
                e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
              )
            }
            placeholder={"Gym 5x/week minimum\n7h sleep minimum\nProtein in every meal"}
          />
        </Field>
        <Field label="Hard stops (one per line)">
          <Textarea
            rows={4}
            value={hardStops.join("\n")}
            onChange={(e) =>
              setRule(
                "hardStops",
                e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
              )
            }
            placeholder={"No phone in first 30min of day\nNo unplanned spending this month"}
          />
        </Field>
      </Section>

      <div className="sticky bottom-16 z-10 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/90 md:bottom-6">
        <div className="text-sm">
          {state === "saved" && (
            <span className="flex items-center gap-1 text-emerald-600">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
          {state === "error" && <span className="text-rose-600">{error ?? "Error"}</span>}
          {state === "idle" && (
            <span className="text-stone-500">Save, then generate your week.</span>
          )}
        </div>
        <Button onClick={() => void save()} disabled={state === "saving"} className="rounded-xl">
          {state === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2">Save Life OS</span>
        </Button>
      </div>
    </div>
  );
}
