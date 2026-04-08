import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { userNeedsDailyCheckin } from "@/lib/checkin-status";
import { Header } from "@/components/layout/Header";
import { DailyCheckinCard } from "@/components/dashboard/DailyCheckinCard";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { ConnectionScoreRing } from "@/components/dashboard/ConnectionScoreRing";
import { GoalsPreview } from "@/components/dashboard/GoalsPreview";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logRealWorldInteraction } from "@/app/(app)/home/actions";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [needs, user] = await Promise.all([
    userNeedsDailyCheckin(session.user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      include: {
        streak: true,
        socialGoals: { orderBy: { createdAt: "desc" }, take: 6 },
      },
    }),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Home" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-8">
        <DailyCheckinCard needsCheckin={needs} />
        <div className="flex flex-wrap items-center gap-3">
          <StreakBadge count={user.streak?.currentStreak ?? 0} pulse={needs} />
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/score">View connection score</Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-[160px_1fr] md:items-start">
          <div className="flex justify-center md:justify-start">
            <ConnectionScoreRing score={user.connectionScore} />
          </div>
          <GoalsPreview goals={user.socialGoals} />
        </div>
        <section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link href="/chat">Open chats</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/coaching">Practice a scenario</Link>
            </Button>
            <form action={logRealWorldInteraction}>
              <Button type="submit" variant="amber" className="rounded-xl">
                I did something!
              </Button>
            </form>
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Log a tiny real-world step — coffee, a text, a hello. Small counts.
          </p>
        </section>
      </main>
    </div>
  );
}
