import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingContent } from "@/components/landing/LandingHero";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/home");
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] text-stone-900 dark:bg-[#0f1412] dark:text-stone-50 overflow-hidden">
      <LandingContent />
    </div>
  );
}
