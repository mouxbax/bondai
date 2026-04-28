"use client";

import * as React from "react";
import { ShoppingCart } from "lucide-react";
import { PlanSectionShell } from "@/components/life-os/PlanSectionShell";
import { Badge } from "@/components/ui/badge";
import type { GroceryItem } from "@/lib/life-os/types";

const GROCERY_CAT_LABEL: Record<GroceryItem["category"], string> = {
  protein: "Protein",
  carbs: "Carbs",
  produce: "Produce",
  dairy: "Dairy",
  pantry: "Pantry",
  snack: "Snacks",
  other: "Other",
};

function fmtEUR(n: number | undefined): string {
  if (n === undefined) return "";
  return `~${Math.round(n).toLocaleString()}EUR`;
}

export default function GroceryPage() {
  return (
    <PlanSectionShell
      title="Grocery List"
      icon={<ShoppingCart className="h-5 w-5 text-amber-500" />}
    >
      {(plan) => {
        if (!plan.grocery || plan.grocery.items.length === 0) return null;
        const grocery = plan.grocery;

        const byCat = new Map<GroceryItem["category"], GroceryItem[]>();
        for (const it of grocery.items) {
          const list = byCat.get(it.category) ?? [];
          list.push(it);
          byCat.set(it.category, list);
        }

        return (
          <div className="space-y-6">
            {grocery.estimatedBudgetEUR !== undefined && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{fmtEUR(grocery.estimatedBudgetEUR)}</Badge>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(
                ["protein", "carbs", "produce", "dairy", "pantry", "snack", "other"] as const
              )
                .filter((c) => (byCat.get(c)?.length ?? 0) > 0)
                .map((c) => (
                  <div key={c} className="rounded-xl border border-stone-200 dark:border-stone-800 p-4">
                    <div className="text-xs uppercase tracking-wide text-stone-500 mb-3 font-semibold">
                      {GROCERY_CAT_LABEL[c]}
                    </div>
                    <ul className="space-y-2 text-sm">
                      {byCat.get(c)!.map((it, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span>{it.name}</span>
                          <span className="text-stone-500 text-xs font-mono shrink-0">{it.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
            {grocery.note && (
              <p className="text-xs text-stone-500 italic">{grocery.note}</p>
            )}
          </div>
        );
      }}
    </PlanSectionShell>
  );
}
