"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setSuccess(null);

    if (mode === "signup") {
      // Create account first
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok) {
        setErr(data.error || "Could not create account.");
        setBusy(false);
        return;
      }
      setSuccess(data.message || "Account created!");
      // Auto sign-in after signup
    }

    // Sign in with credentials
    const result = await signIn("email-password", {
      email: email.trim().toLowerCase(),
      password,
      callbackUrl: "/home",
      redirect: false,
    });

    if (result?.error) {
      if (mode === "signup") {
        setErr("Account created but could not sign in automatically. Try signing in.");
      } else {
        setErr("Invalid email or password.");
      }
      setBusy(false);
      return;
    }

    // Redirect on success
    window.location.href = "/home";
  };

  const google = async () => {
    setBusy(true);
    setErr(null);
    await signIn("google", { callbackUrl: "/home" });
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-sm font-semibold text-[#1D9E75]">
        &larr; Back to AIAH
      </Link>
      <Card className="border-stone-100 shadow-md dark:border-stone-800">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to continue your check-ins and goals."
              : "Start your journey toward real connection."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            disabled={busy}
            onClick={() => void google()}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stone-200 dark:border-stone-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                or
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={(e) => void handleEmailPassword(e)} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-xl"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                required
                minLength={6}
                className="rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-stone-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-[#1D9E75] hover:underline"
                  onClick={() => { setMode("signup"); setErr(null); setSuccess(null); }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-[#1D9E75] hover:underline"
                  onClick={() => { setMode("login"); setErr(null); setSuccess(null); }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {err && <p className="rounded-lg bg-rose-50 p-2 text-center text-sm text-rose-600 dark:bg-rose-950/30">{err}</p>}
          {success && <p className="rounded-lg bg-emerald-50 p-2 text-center text-sm text-emerald-600 dark:bg-emerald-950/30">{success}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
