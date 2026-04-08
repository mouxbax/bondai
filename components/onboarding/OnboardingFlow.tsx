"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Step1Welcome } from "@/components/onboarding/steps/Step1Welcome";
import { Step2Situation } from "@/components/onboarding/steps/Step2Situation";
import { Step3Anxiety } from "@/components/onboarding/steps/Step3Anxiety";
import { Step4Goals } from "@/components/onboarding/steps/Step4Goals";
import { Step5Voice } from "@/components/onboarding/steps/Step5Voice";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [situations, setSituations] = React.useState<string[]>([]);
  const [anxietyLevel, setAnxietyLevel] = React.useState(3);
  const [anxietyNote, setAnxietyNote] = React.useState("");
  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalDescription, setGoalDescription] = React.useState("");
  const [voice, setVoice] = React.useState(false);

  const toggleSit = (s: string) => {
    setSituations((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const canNext =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && situations.length > 0) ||
    step === 2 ||
    (step === 3 && goalTitle.trim() && goalDescription.trim()) ||
    step === 4;

  const finish = async () => {
    setBusy(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        situations,
        anxietyLevel,
        anxietyNote,
        goalTitle: goalTitle.trim(),
        goalDescription: goalDescription.trim(),
        voicePreferred: voice,
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = (await res.json()) as { conversationId: string };
    router.push(`/chat/${data.conversationId}`);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          Step {step + 1} of 5
        </span>
        <div className="h-1 flex-1 mx-4 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-[#1D9E75] transition-all"
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {step === 0 ? <Step1Welcome name={name} setName={setName} /> : null}
          {step === 1 ? <Step2Situation selected={situations} toggle={toggleSit} /> : null}
          {step === 2 ? (
            <Step3Anxiety level={anxietyLevel} setLevel={setAnxietyLevel} note={anxietyNote} setNote={setAnxietyNote} />
          ) : null}
          {step === 3 ? (
            <Step4Goals
              title={goalTitle}
              setTitle={setGoalTitle}
              description={goalDescription}
              setDescription={setGoalDescription}
            />
          ) : null}
          {step === 4 ? <Step5Voice voice={voice} setVoice={setVoice} /> : null}
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 4 ? (
          <Button type="button" className="flex-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button type="button" className="flex-1" disabled={busy} onClick={() => void finish()}>
            {busy ? "Saving…" : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
