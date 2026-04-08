"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CrisisPayload, CrisisResource } from "@/types";

interface CrisisModalProps {
  open: boolean;
  payload: CrisisPayload | null;
  resources: CrisisResource[];
  onDismiss: () => void;
  onNeedSupport: () => void;
}

export function CrisisModal({ open, payload, resources, onDismiss, onNeedSupport }: CrisisModalProps) {
  const severity = payload?.severity ?? "low";
  const blocking = severity === "medium" || severity === "high";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        hideClose={blocking}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-md"
        onPointerDownOutside={(e) => blocking && e.preventDefault()}
        onEscapeKeyDown={(e) => blocking && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>I want to make sure you&apos;re okay.</DialogTitle>
          <DialogDescription>
            If you&apos;re in immediate danger, contact local emergency services. You deserve support — these resources
            are free and confidential.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm text-stone-700 dark:text-stone-200">
          {resources.map((r) => (
            <li key={r.label} className="rounded-xl border border-stone-100 bg-white/60 p-3 dark:border-stone-800 dark:bg-stone-950/40">
              <p className="font-semibold">{r.label}</p>
              <p className="text-stone-600 dark:text-stone-400">{r.detail}</p>
              {r.href ? (
                <a className="mt-1 inline-block text-[#1D9E75] underline" href={r.href} target="_blank" rel="noreferrer">
                  Open link
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="secondary" className="w-full" type="button" onClick={onDismiss}>
            I&apos;m okay, just venting
          </Button>
          <Button className="w-full" type="button" onClick={onNeedSupport}>
            I need support
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
