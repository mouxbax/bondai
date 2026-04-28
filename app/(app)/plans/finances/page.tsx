"use client";

import { Wallet } from "lucide-react";
import { PlanSectionShell } from "@/components/life-os/PlanSectionShell";

function fmtEUR(n: number | undefined): string {
  if (n === undefined) return "—";
  return `${Math.round(n).toLocaleString()}€`;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const color =
    tone === "good"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400"
        : "text-stone-800 dark:text-stone-200";
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4">
      <div className="text-[10px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`text-xl font-semibold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

export default function FinancesPage() {
  return (
    <PlanSectionShell
      title="Finances"
      icon={<Wallet className="h-5 w-5 text-yellow-500" />}
    >
      {(plan) => {
        if (!plan.finances) return null;
        const f = plan.finances;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Stat label="Monthly income" value={fmtEUR(f.monthlyIncomeEUR)} tone="good" />
              <Stat label="Fixed expenses" value={fmtEUR(f.fixedExpensesEUR)} />
              <Stat label="Food budget" value={fmtEUR(f.foodBudgetEUR)} />
              <Stat label="Debt payment" value={fmtEUR(f.debtPaymentEUR)} tone="warn" />
              <Stat label="Savings" value={fmtEUR(f.savingsEUR)} tone="good" />
              <Stat label="Buffer" value={fmtEUR(f.bufferEUR)} />
            </div>
            {f.notes && f.notes.length > 0 && (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                <div className="text-xs uppercase tracking-wide text-stone-500 mb-2">Notes</div>
                <ul className="space-y-1.5 text-sm">
                  {f.notes.map((n, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-yellow-600 shrink-0">*</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }}
    </PlanSectionShell>
  );
}
