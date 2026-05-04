import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { isSubscriptionActive, type SubscriptionStatus } from "@/lib/stripe";
import { AppNav } from "@/components/layout/AppNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { RitualModal } from "@/components/companion/RitualModal";
import { AmbientPlayer } from "@/components/companion/AmbientPlayer";
import { TutorialGate } from "@/components/tutorial/TutorialGate";
import { EggGate } from "@/components/companion/EggGate";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

// Routes inside (app) that remain accessible even WITHOUT an active
// subscription — so the user can pick a plan, manage billing, or sign out.
const SUB_GATE_EXEMPT_PREFIXES = ["/subscribe", "/account"];

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { id: session.user.id } });
  } catch (err) {
    console.error("[AppShellLayout] Prisma query failed:", err);
    throw err;
  }

  // Zombie session - the JWT points at a user row that no longer exists
  // (typical after a local db reset). Bounce to login so NextAuth can clear
  // the cookie on the next sign-in attempt. Without this, every API call in
  // the shell would 401 with no way for the user to recover.
  if (!user) {
    redirect("/login?stale=1");
  }

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  // Subscription gate. Anything outside the exempt prefixes requires a
  // trialing or active subscription. Free / canceled / past_due users are
  // sent to /subscribe to either start a trial or fix billing.
  const hdrs = headers();
  const pathname = hdrs.get("x-pathname") || "";
  const isExempt = SUB_GATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
  if (
    !isExempt &&
    !isSubscriptionActive(user.subscriptionStatus as SubscriptionStatus)
  ) {
    redirect("/subscribe");
  }

  const hasActiveSub = isSubscriptionActive(user.subscriptionStatus as SubscriptionStatus);

  // If user hasn't subscribed yet, show a minimal layout (no nav, no tutorial)
  if (!hasActiveSub) {
    return (
      <div className="min-h-[100dvh] bg-background">
        {children}
      </div>
    );
  }

  return (
    <EggGate>
      <div className="flex min-h-[100dvh] bg-background">
        <AppNav />
        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col pb-16 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
        <AmbientPlayer />
        <RitualModal />
        <TutorialGate hasSeenTutorial={user.hasSeenTutorial} />
      </div>
    </EggGate>
  );
}
