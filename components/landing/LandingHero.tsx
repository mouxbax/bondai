"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeartHandshake, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingBlob } from "@/components/ui/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  hover: { y: -4, boxShadow: "0 8px 30px rgba(29,158,117,0.12)", transition: { type: "spring" as const, stiffness: 300 } },
};

const features = [
  { icon: Sparkles, title: "Daily check-ins that remember you", desc: "Warm questions, gentle accountability, and tiny outward steps." },
  { icon: Users, title: "Social skills practice", desc: "Roleplay neighbors, coworkers, and boundaries with realistic pacing." },
  { icon: HeartHandshake, title: "Connection score & goals", desc: "Track momentum without shame — celebrate real-world wins." },
];

const tiers = [
  { name: "Free", price: "$0", desc: "Daily check-ins, coaching scenarios, goals, crisis resources." },
  { name: "Plus", price: "$9", desc: "Deeper memory, richer insights, priority model routing (coming soon)." },
  { name: "Care+", price: "$19", desc: "For teams & communities — analytics and facilitator tools (coming soon)." },
];

export function LandingContent() {
  return (
    <>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 md:px-8"
      >
        <span className="text-lg font-semibold text-[#1D9E75]">AIAH</span>
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="rounded-xl">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </motion.header>

      <main className="mx-auto max-w-5xl space-y-16 px-4 pb-24 pt-6 md:px-8">
        {/* Hero */}
        <section className="relative space-y-6 text-center md:text-left">
          <FloatingBlob className="-top-20 -left-20 h-72 w-72 bg-[#1D9E75]/20" />
          <FloatingBlob className="top-10 right-0 h-56 w-56 bg-emerald-300/15" />

          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex rounded-full bg-[#1D9E75]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0f6b4f] dark:text-emerald-200"
          >
            AI as a bridge — not a replacement
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-balance text-4xl font-semibold tracking-tight md:text-5xl"
          >
            You deserve to feel less alone.
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mx-auto max-w-2xl text-lg text-stone-600 dark:text-stone-300 md:mx-0"
          >
            AIAH checks in like a thoughtful friend, helps you practice real-world conversations, and nudges you toward
            people — until you need us a little less.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start"
          >
            <Button asChild size="lg" className="rounded-2xl px-8 relative overflow-hidden group">
              <Link href="/login">
                <span className="relative z-10">Start free</span>
                <motion.span
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-2xl px-8">
              <Link href="#features">See how it works</Link>
            </Button>
          </motion.div>
        </section>

        {/* Features */}
        <motion.section
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
          className="grid gap-4 md:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} custom={0}>
              <motion.div initial="rest" whileHover="hover" variants={cardHover}>
                <Card className="border-stone-100 shadow-sm dark:border-stone-800 h-full transition-colors hover:border-[#1D9E75]/30">
                  <CardHeader>
                    <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                      <f.icon className="mb-2 h-8 w-8 text-[#1D9E75]" />
                    </motion.div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.section>

        {/* Research */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-stone-100 bg-white/80 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/60 md:p-10"
        >
          <h2 className="text-xl font-semibold">Backed by research on loneliness</h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            Loneliness is a global health priority — the WHO highlights social connection as protective for mental and physical
            health. AIAH is designed to reduce isolation by strengthening your confidence with people, not replacing them.
          </p>
        </motion.section>

        {/* Pricing */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid gap-4 md:grid-cols-3"
        >
          {tiers.map((tier, i) => (
            <motion.div key={tier.name} variants={fadeUp} custom={i}>
              <motion.div initial="rest" whileHover="hover" variants={cardHover}>
                <Card className={`border-stone-100 dark:border-stone-800 h-full transition-colors ${
                  tier.name === "Plus" ? "ring-2 ring-[#1D9E75]/40" : ""
                }`}>
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
                      {tier.price}
                      <span className="text-sm font-normal text-stone-500">/mo</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{tier.desc}</p>
                    <Button
                      asChild
                      className={`mt-4 w-full rounded-xl ${
                        tier.name === "Plus" ? "bg-[#1D9E75] hover:bg-[#178f6a]" : ""
                      }`}
                      variant={tier.name === "Plus" ? "default" : "secondary"}
                    >
                      <Link href="/login">{tier.name === "Free" ? "Get started" : "Start free trial"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-stone-100 py-8 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400"
      >
        AIAH · Built with care · If you&apos;re in crisis, visit{" "}
        <a className="text-[#1D9E75] underline" href="https://findahelpline.com">
          findahelpline.com
        </a>
      </motion.footer>
    </>
  );
}
