"use client";

import { useRouter } from "next/navigation";
import { BreathingExercise } from "@/components/companion/BreathingExercise";

export default function BreathePage() {
  const router = useRouter();
  return (
    <BreathingExercise
      open={true}
      onClose={() => router.push("/home")}
    />
  );
}
