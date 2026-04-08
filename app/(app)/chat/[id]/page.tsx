import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getConversationForUser } from "@/lib/db/queries/conversations";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Header } from "@/components/layout/Header";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return null;

  const convo = await getConversationForUser(id, session.user.id);
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
