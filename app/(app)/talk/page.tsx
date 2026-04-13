import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createConversation,
  listConversationsForUser,
} from "@/lib/db/queries/conversations";

/**
 * Instant "Talk" entry point. Finds the most recent GENERAL conversation or
 * creates one, then redirects straight into it with voice mode enabled.
 * This is the primary "talk to AIAH" CTA from the home screen.
 */
export default async function TalkEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ voice?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const voice = params.voice === "1";

  // Try to reuse the latest general conversation
  const conversations = await listConversationsForUser(session.user.id);
  const latestGeneral = conversations.find((c) => c.type === "GENERAL");

  let conversationId: string;
  if (latestGeneral) {
    conversationId = latestGeneral.id;
  } else {
    const convo = await createConversation(
      session.user.id,
      "GENERAL",
      "Talk with AIAH",
      null,
    );
    conversationId = convo.id;
  }

  redirect(`/chat/${conversationId}${voice ? "?voice=1" : ""}`);
}
