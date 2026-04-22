import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  const contact = process.env.VAPID_CONTACT_EMAIL || "admin@aiah.app";
  webpush.setVapidDetails(`mailto:${contact}`, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  renotify?: boolean;
}

export interface PushResult {
  sent: number;
  removed: number;
  failed: number;
}

/**
 * Fire a push to every subscription a user has.
 * Expired endpoints (404/410) are cleaned from the DB so we don't keep trying.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  if (!configure()) return { sent: 0, removed: 0, failed: 0 };

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: 0, removed: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60 },
        );
        sent++;
        await prisma.pushSubscription.update({
          where: { id: s.id },
          data: { lastUsed: new Date() },
        });
      } catch (e: unknown) {
        const err = e as { statusCode?: number };
        // 404 / 410 = endpoint is gone, clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => {});
          removed++;
        } else {
          failed++;
        }
      }
    }),
  );

  return { sent, removed, failed };
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
