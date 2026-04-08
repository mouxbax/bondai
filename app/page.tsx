import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartHandshake, Sparkles, Users } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/home");
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] text-stone-900 dark:bg-[#0f1412] dark:text-stone-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 md:px-8">
        <span className="text-lg font-semibold text-[#1D9E75]">BondAI</span>
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-4 pb-24 pt-6 md:px-8">
        <section className="space-y-6 text-center md:text-left">
          <p className="inline-flex rounded-full bg-[#1D9E75]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0f6b4f] dark:text-emerald-200">
            AI as a bridge — not a replacement
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            You deserve to feel less alone.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-stone-600 dark:text-stone-300 md:mx-0">
            BondAI checks in like a thoughtful friend, helps you practice real-world conversations, and nudges you toward
            people — until you need us a little less.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Button asChild size="lg" className="rounded-2xl px-8">
              <Link href="/login">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-2xl px-8">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="grid gap-4 md:grid-cols-3">
          <Card className="border-stone-100 shadow-sm dark:border-stone-800">
            <CardHeader>
              <Sparkles className="mb-2 h-8 w-8 text-[#1D9E75]" />
              <CardTitle className="text-base">Daily check-ins that remember you</CardTitle>
              <CardDescription>Warm questions, gentle accountability, and tiny outward steps.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-stone-100 shadow-sm dark:border-stone-800">
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-[#1D9E75]" />
              <CardTitle className="text-base">Social skills practice</CardTitle>
              <CardDescription>Roleplay neighbors, coworkers, and boundaries with realistic pacing.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-stone-100 shadow-sm dark:border-stone-800">
            <CardHeader>
              <HeartHandshake className="mb-2 h-8 w-8 text-[#1D9E75]" />
              <CardTitle className="text-base">Connection score & goals</CardTitle>
              <CardDescription>Track momentum without shame — celebrate real-world wins.</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="rounded-3xl border border-stone-100 bg-white/80 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/60 md:p-10">
          <h2 className="text-xl font-semibold">Backed by research on loneliness</h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            Loneliness is a global health priority — the WHO highlights social connection as protective for mental and physical
            health. BondAI is designed to reduce isolation by strengthening your confidence with people, not replacing them.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Free", price: "$0", desc: "Daily check-ins, coaching scenarios, goals, crisis resources." },
            { name: "Plus", price: "$9", desc: "Deeper memory, richer insights, priority model routing (coming soon)." },
            { name: "Care+", price: "$19", desc: "For teams & communities — analytics and facilitator tools (coming soon)." },
          ].map((tier) => (
            <Card key={tier.name} className="border-stone-100 dark:border-stone-800">
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription className="text-2xl font-semibold text-stone-900 dark:text-stone-50">{tier.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 dark:text-stone-300">{tier.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-stone-100 py-8 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
        BondAI · Built with care · If you&apos;re in crisis, visit{" "}
        <a className="text-[#1D9E75] underline" href="https://findahelpline.com">
          findahelpline.com
        </a>
      </footer>
    </div>
  );
}
