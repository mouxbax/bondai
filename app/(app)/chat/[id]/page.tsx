import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Header } from "@/components/layout/Header";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return null;

  // Only fetch metadata — no messages. ChatRoom loads them client-side.
  const convo = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, type: true, scenarioId: true },
  });
  if (!convo) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title={convo.title} />
      <Suspense fallback={<div className="p-6 text-sm text-stone-500">Loading chat…</div>}>
        <ChatRoom conversationId={convo.id} type={convo.type} scenarioId={convo.scenarioId} />
      </Suspense>
    </div>
  );
}
