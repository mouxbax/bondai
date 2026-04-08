"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = React.useState("demo@bondai.app");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const devEnabled = process.env.NODE_ENV === "development";

  const devSignIn = async () => {
    setBusy(true);
    setErr(null);
    const res = await signIn("dev-email", {
      email: email.trim(),
      callbackUrl: "/home",
      redirect: true,
    });
    if (res?.error) setErr("Could not sign in.");
    setBusy(false);
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
        ← Back to BondAI
      </Link>
      <Card className="border-stone-100 shadow-md dark:border-stone-800">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to continue your check-ins and goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" className="w-full rounded-xl" disabled={busy} onClick={() => void google()}>
            Continue with Google
          </Button>
          {devEnabled ? (
            <div className="space-y-2 rounded-xl border border-dashed border-stone-200 p-3 dark:border-stone-700">
              <p className="text-xs text-stone-500">Development sign-in (no OAuth required)</p>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="button" variant="secondary" className="w-full rounded-xl" disabled={busy} onClick={() => void devSignIn()}>
                {busy ? "Signing in…" : "Sign in with email (dev)"}
              </Button>
            </div>
          ) : null}
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
