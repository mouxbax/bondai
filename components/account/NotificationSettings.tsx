"use client";

import * as React from "react";
import { Bell, BellOff, Send, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";

type Prefs = {
  enabled: boolean;
  morning: boolean;
  midday: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  quietStart: number;
  quietEnd: number;
};

const SLOTS: Array<{ key: keyof Prefs; label: string; hint: string }> = [
  { key: "morning", label: "Morning", hint: "Soft start, around 8am" },
  { key: "midday", label: "Midday", hint: "Light check-in, around 1pm" },
  { key: "afternoon", label: "Afternoon", hint: "Grounding moment, around 4pm" },
  { key: "evening", label: "Evening", hint: "Reflective, around 8pm" },
  { key: "night", label: "Night", hint: "Tender wind-down, around 10pm" },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export function NotificationSettings() {
  const { status, error, subscribe, unsubscribe, sendTest } = usePushNotifications();
  const [prefs, setPrefs] = React.useState<Prefs | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const loadPrefs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/account/push-prefs", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { prefs: Prefs };
      setPrefs(j.prefs);
    } catch {}
  }, []);

  React.useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const savePrefs = React.useCallback(async (patch: Partial<Prefs>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/push-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const j = (await res.json()) as { prefs: Prefs };
        setPrefs(j.prefs);
        setFlash("Saved");
        setTimeout(() => setFlash(null), 1500);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    const ok = await subscribe();
    if (ok) await savePrefs({ enabled: true });
    setBusy(false);
  };

  const handleDisable = async () => {
    setBusy(true);
    await unsubscribe();
    await savePrefs({ enabled: false });
    setBusy(false);
  };

  const handleTest = async () => {
    setTesting(true);
    const ok = await sendTest();
    if (ok) {
      setFlash("Test sent");
      setTimeout(() => setFlash(null), 2000);
    }
    setTesting(false);
  };

  const subscribed = status === "subscribed";
  const denied = status === "denied";
  const unsupported = status === "unsupported";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Gentle nudges
        </CardTitle>
        <CardDescription>
          Warm, personalized pings through the day — never generic, never pushy. Turn off any slot or pause the lot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {unsupported && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            This browser doesn&apos;t support push notifications. Try installing AIAH to your home screen on iOS, or use Chrome / Safari on desktop.
          </div>
        )}
        {denied && (
          <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            Notifications were blocked. Enable them in your browser settings for this site, then reload.
          </div>
        )}
        {error && (
          <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-medium">
              {subscribed ? "Notifications on" : "Notifications off"}
            </div>
            <div className="text-sm text-zinc-500">
              {subscribed
                ? "You&apos;ll hear from AIAH at the times you pick below."
                : "Enable to start receiving gentle check-ins."}
            </div>
          </div>
          {subscribed ? (
            <Button variant="outline" onClick={handleDisable} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
              <span className="ml-2">Turn off</span>
            </Button>
          ) : (
            <Button onClick={handleEnable} disabled={busy || denied || unsupported}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              <span className="ml-2">Enable</span>
            </Button>
          )}
        </div>

        {prefs && subscribed && (
          <>
            <div className="space-y-3 pt-2">
              {SLOTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-zinc-500">{s.hint}</div>
                  </div>
                  <Toggle
                    checked={Boolean(prefs[s.key])}
                    onChange={(v) => savePrefs({ [s.key]: v } as Partial<Prefs>)}
                    disabled={saving || !prefs.enabled}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Label className="text-sm">Quiet hours</Label>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500">From</span>
                <select
                  value={prefs.quietStart}
                  onChange={(e) => savePrefs({ quietStart: Number(e.target.value) })}
                  className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
                  disabled={saving}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
                <span className="text-zinc-500">to</span>
                <select
                  value={prefs.quietEnd}
                  onChange={(e) => savePrefs({ quietEnd: Number(e.target.value) })}
                  className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
                  disabled={saving}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2">Send test</span>
              </Button>
              {flash && (
                <span className="text-sm text-emerald-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> {flash}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
