"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Save, X, Plus, Loader2, Check, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AccountData = {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  timezone: string | null;
  anxietyLevel: number | null;
  age: number | null;
  sex: string | null;
  interests: string[];
  likes: string | null;
  dislikes: string | null;
  bio: string | null;
  memorySnippet: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const SEX_OPTIONS = ["male", "female", "nonbinary", "prefer not to say"];

export function AccountClient() {
  const [data, setData] = React.useState<AccountData | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });
  const [newInterest, setNewInterest] = React.useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [pwStatus, setPwStatus] = React.useState<Status>({ kind: "idle" });
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deleteStatus, setDeleteStatus] = React.useState<Status>({ kind: "idle" });

  const load = React.useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/account", { cache: "no-store" });
      if (res.status === 401 || res.status === 404) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setLoadError(
          body.error ||
            "Your session has expired or your account no longer exists. Please sign out and sign back in.",
        );
        return;
      }
      if (!res.ok) {
        setLoadError(`Could not load your profile (${res.status}).`);
        return;
      }
      const json = (await res.json()) as { user: AccountData };
      setData(json.user);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Network error loading your profile.");
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof AccountData>(key: K, value: AccountData[K]) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
    setStatus({ kind: "idle" });
  };

  const addInterest = () => {
    const tag = newInterest.trim();
    if (!tag || !data) return;
    if (data.interests.includes(tag)) {
      setNewInterest("");
      return;
    }
    update("interests", [...data.interests, tag].slice(0, 20));
    setNewInterest("");
  };

  const removeInterest = (tag: string) => {
    if (!data) return;
    update(
      "interests",
      data.interests.filter((t) => t !== tag),
    );
  };

  const save = async () => {
    if (!data) return;
    setStatus({ kind: "saving" });
    try {
      const body = {
        name: data.name?.trim() || undefined,
        city: data.city?.trim() || null,
        age: data.age ?? null,
        sex: data.sex?.trim() || null,
        interests: data.interests,
        likes: data.likes?.trim() || null,
        dislikes: data.dislikes?.trim() || null,
        bio: data.bio?.trim() || null,
        memorySnippet: data.memorySnippet?.trim() || null,
        anxietyLevel: data.anxietyLevel ?? null,
      };
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus({ kind: "error", message: err.error || `Save failed (${res.status}).` });
        return;
      }
      setStatus({ kind: "saved" });
      setTimeout(() => setStatus({ kind: "idle" }), 2000);
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error while saving.",
      });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 8) {
      setPwStatus({
        kind: "error",
        message: "New password must be at least 8 characters.",
      });
      return;
    }
    setPwStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !body.ok) {
        setPwStatus({
          kind: "error",
          message: body.error || `Could not change password (${res.status}).`,
        });
        return;
      }
      setPwStatus({ kind: "saved" });
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPwStatus({ kind: "idle" }), 2500);
    } catch (e) {
      setPwStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error.",
      });
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleteStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleteStatus({
          kind: "error",
          message: body.error || `Could not delete account (${res.status}).`,
        });
        return;
      }
      // Sign the user out and bounce to login with a farewell flag.
      await signOut({ callbackUrl: "/login?deleted=1" });
    } catch (e) {
      setDeleteStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error.",
      });
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
        <Card className="border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30">
          <CardHeader>
            <CardTitle className="text-rose-700 dark:text-rose-300">
              Couldn&apos;t load your account
            </CardTitle>
            <CardDescription className="text-rose-600/80 dark:text-rose-200/70">
              {loadError}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void load()}
            >
              Try again
            </Button>
            <Button
              variant="default"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* --- Basic profile --- */}
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
          <CardDescription>How AIAH refers to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data.name ?? ""}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={data.email ?? ""} disabled readOnly />
            <p className="text-xs text-stone-500">
              Your sign-in email. Contact support to change it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.city ?? ""}
                onChange={(e) => update("city", e.target.value)}
                placeholder="e.g. Paris"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={13}
                max={120}
                value={data.age ?? ""}
                onChange={(e) =>
                  update("age", e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="—"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sex</Label>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map((opt) => {
                const active = (data.sex ?? "").toLowerCase() === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update("sex", active ? null : opt)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                      (active
                        ? "bg-[#1D9E75] text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700")
                    }
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- About you --- */}
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
          <CardDescription>A short bio that helps AIAH understand you better.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={data.bio ?? ""}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="A few sentences about who you are, what you're working on, what matters to you…"
              maxLength={1000}
            />
          </div>
          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {data.interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1D9E75]/10 px-3 py-1 text-xs font-medium text-[#0f6b4f] dark:bg-[#1D9E75]/20 dark:text-emerald-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeInterest(tag)}
                    className="rounded-full p-0.5 hover:bg-[#1D9E75]/20"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInterest();
                  }
                }}
                placeholder="Add an interest…"
                maxLength={40}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addInterest}
                disabled={!newInterest.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="likes">Things you like</Label>
              <Textarea
                id="likes"
                value={data.likes ?? ""}
                onChange={(e) => update("likes", e.target.value)}
                placeholder="Long walks, sci-fi, lo-fi beats…"
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dislikes">Things you don&apos;t</Label>
              <Textarea
                id="dislikes"
                value={data.dislikes ?? ""}
                onChange={(e) => update("dislikes", e.target.value)}
                placeholder="Small talk, being rushed…"
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="memory">A note for AIAH to remember</Label>
            <Textarea
              id="memory"
              value={data.memorySnippet ?? ""}
              onChange={(e) => update("memorySnippet", e.target.value)}
              placeholder="Anything important AIAH should keep in mind across conversations."
              maxLength={1000}
            />
          </div>
        </CardContent>
      </Card>

      {/* --- Save bar --- */}
      <div className="sticky bottom-16 z-10 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/90 md:bottom-6">
        <AnimatePresence mode="wait">
          {status.kind === "saved" ? (
            <motion.span
              key="saved"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"
            >
              <Check className="h-4 w-4" />
              Saved
            </motion.span>
          ) : status.kind === "error" ? (
            <motion.span
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm text-rose-600 dark:text-rose-400"
            >
              {status.message}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-stone-500"
            >
              Changes are saved manually.
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={status.kind === "saving"}
          className="shrink-0"
        >
          {status.kind === "saving" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>

      {/* --- Password --- */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Only for email-and-password accounts. Google / magic-link users can skip this.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void changePassword(e)} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  aria-label={showCurrentPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  aria-label={showNewPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-stone-500">At least 8 characters.</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <AnimatePresence mode="wait">
                {pwStatus.kind === "saved" ? (
                  <motion.span
                    key="pw-saved"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                    Password changed
                  </motion.span>
                ) : pwStatus.kind === "error" ? (
                  <motion.span
                    key="pw-error"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-rose-600 dark:text-rose-400"
                  >
                    {pwStatus.message}
                  </motion.span>
                ) : (
                  <span />
                )}
              </AnimatePresence>
              <Button
                type="submit"
                variant="outline"
                disabled={pwStatus.kind === "saving"}
                className="shrink-0"
              >
                {pwStatus.kind === "saving" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* --- Subscription readout --- */}
      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            You&apos;re on <strong className="capitalize">{data.subscriptionPlan}</strong>
            {data.subscriptionStatus ? ` (${data.subscriptionStatus})` : ""}.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* --- Sign out --- */}
      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>You&apos;ll be taken back to the login screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out of AIAH
          </Button>
        </CardContent>
      </Card>

      {/* --- Danger zone --- */}
      <Card className="border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5" />
            Danger zone
          </CardTitle>
          <CardDescription className="text-rose-700/80 dark:text-rose-200/70">
            Permanently delete your account and all associated data — conversations,
            goals, streaks, check-ins. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="deleteConfirm" className="text-rose-700 dark:text-rose-300">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => {
                setDeleteConfirm(e.target.value);
                if (deleteStatus.kind === "error") setDeleteStatus({ kind: "idle" });
              }}
              placeholder="DELETE"
              autoComplete="off"
              className="border-rose-300 bg-white focus-visible:ring-rose-400 dark:border-rose-900/60 dark:bg-stone-900"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <AnimatePresence mode="wait">
              {deleteStatus.kind === "error" ? (
                <motion.span
                  key="del-error"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-rose-600 dark:text-rose-400"
                >
                  {deleteStatus.message}
                </motion.span>
              ) : (
                <span />
              )}
            </AnimatePresence>
            <Button
              type="button"
              onClick={() => void deleteAccount()}
              disabled={deleteConfirm !== "DELETE" || deleteStatus.kind === "saving"}
              className="shrink-0 bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 disabled:bg-rose-300 disabled:text-white/80 dark:bg-rose-700 dark:hover:bg-rose-600 dark:disabled:bg-rose-900/60"
            >
              {deleteStatus.kind === "saving" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete my account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
