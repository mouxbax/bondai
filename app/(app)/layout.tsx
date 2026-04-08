import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { AppNav } from "@/components/layout/AppNav";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#FAFAF8] dark:bg-[#0f1412]">
      <AppNav />
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col pb-16 md:pb-0">{children}</div>
    </div>
  );
}
