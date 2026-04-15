import Link from "next/link";
import { auth } from "@/auth";
import { listConversationsForUser } from "@/lib/db/queries/conversations";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { AnimatedChatList, AnimatedChatItem } from "@/components/chat/ChatListAnimated";

export default async function ChatListPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await listConversationsForUser(session.user.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Chats" />
      <AnimatedChatList>
        {rows.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No conversations yet - start a check-in from Home.</p>
        ) : (
          rows.map((c) => (
            <AnimatedChatItem key={c.id}>
              <Link href={`/chat/${c.id}`}>
                <Card className="border-stone-100 transition-shadow hover:shadow-md dark:border-stone-800">
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.unreadCount > 0 ? <Badge variant="amber">New</Badge> : null}
                      <Badge variant="secondary">{c.type.replace("_", " ").toLowerCase()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-stone-600 dark:text-stone-300">
                      {c.lastMessagePreview ?? "No messages yet"}
                    </p>
                    <p className="mt-2 text-xs text-stone-400">{formatRelativeTime(c.updatedAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            </AnimatedChatItem>
          ))
        )}
      </AnimatedChatList>
    </div>
  );
}
