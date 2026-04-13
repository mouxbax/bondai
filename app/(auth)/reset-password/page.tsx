"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TokenState =
  | { kind: "checking" }
  | { kind: "valid"; email: string }
  | { kind: "invalid"; message: string };

type SubmitState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "done" };

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params?.get("token") ?? "";

  const [tokenState, setTokenState] = React.useState<TokenState>({ kind: "checking" });
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [status, setStatus] = React.useState<SubmitState>({ kind: "idle" });

  React.useEffect(() => {
    if (!token) {
      setTokenState({ kind: "invalid", message: "This reset link is missing a token." });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => ({}))) as {
          valid?: boolean;
          email?: string;
          error?: string;
        };
        if (cancelled) return;
        if (res.ok && body.valid && body.email) {
          setTokenState({ kind: "valid", email: body.email });
        } else {
          setTokenState({
            kind: "invalid",
            message: body.error || "This reset link is invalid or expired.",
          });
        }
      } catch (e) {
        if (cancelled) return;
        setTokenState({
          kind: "invalid",
          message: e instanceof Error ? e.message : "Could not verify this reset link.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenState.kind !== "valid") return;

    if (password.length < 8) {
      setStatus({ kind: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ kind: "error", message: "Passwords don't match." });
      return;
    }

    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        email?: string;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        setStatus({ kind: "error", message: body.error || "Could not reset your password." });
        return;
      }
      setStatus({ kind: "done" });

      // Auto sign-in with the new password
      const email = body.email || tokenState.email;
      const result = await signIn("email-password", {
        email,
        password,
        callbackUrl: "/home",
        redirect: false,
      });
      if (!result?.error) {
        window.location.href = "/home";
      }
      // If auto sign-in fails, user will see "done" state and can click through to /login manually.
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              {tokenState.kind === "valid"
                ? `For ${tokenState.email}`
                : tokenState.kind === "checking"
                  ? "Verifying your reset link…"
                  : "We couldn't verify this link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {tokenState.kind === "checking" ? (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-6"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-[#1D9E75]" />
                </motion.div>
              ) : tokenState.kind === "invalid" ? (
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    {tokenState.message}
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/forgot-password">Request a new reset link</Link>
                  </Button>
                </motion.div>
              ) : status.kind === "done" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Password updated. Signing you in…
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Or go to sign in</Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={(e) => void submit(e)}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                      >
                        {showPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-stone-500">At least 8 characters.</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                      id="confirm"
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                  {status.kind === "error" ? (
                    <p className="text-sm text-rose-600 dark:text-rose-400">
                      {status.message}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    disabled={status.kind === "saving" || !password || !confirm}
                    className="w-full"
                  >
                    {status.kind === "saving" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Update password
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1D9E75]" />
        </div>
      }
    >
      <ResetPasswordInner />
    </React.Suspense>
  );
}
