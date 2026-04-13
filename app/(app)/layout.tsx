import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { AppNav } from "@/components/layout/AppNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { QuickCapture } from "@/components/companion/QuickCapture";
import { RitualModal } from "@/components/companion/RitualModal";
import { AmbientPlayer } from "@/components/companion/AmbientPlayer";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  // Zombie session — the JWT points at a user row that no longer exists
  // (typical after a local db reset). Bounce to login so NextAuth can clear
  // the cookie on the next sign-in attempt. Without this, every API call in
  // the shell would 401 with no way for the user to recover.
  if (!user) {
    redirect("/login?stale=1");
  }

  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#FAFAF8] dark:bg-[#0f1412]">
      <AppNav />
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </div>
      <QuickCapture />
      <AmbientPlayer />
      <RitualModal />
    </div>
  );
}
