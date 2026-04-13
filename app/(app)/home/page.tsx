import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";
import { CompanionHome } from "@/components/dashboard/CompanionHome";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true },
  });

  const firstName = user.name?.split(" ")[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="AIAH" />
      <CompanionHome firstName={firstName} />
    </div>
  );
}
