/* eslint-disable no-restricted-globals */
/**
 * Custom service worker additions — merged into the next-pwa generated SW.
 * Handles:
 *   - `push` events (AIAH nudges sent via Web Push from our cron)
 *   - `notificationclick` events (focus or open the app at the right URL)
 *
 * Payload shape the server sends:
 *   { title, body, url?, tag?, icon?, badge? }
 * A missing payload still produces a generic nudge so we never silently fail.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch {
    try {
      data = { body: event.data ? event.data.text() : "" };
    } catch {
      data = {};
    }
  }

  const title = data.title || "AIAH";
  const body = data.body || "A small check-in from AIAH.";
  const tag = data.tag || "aiah-nudge";
  const url = data.url || "/home";

  const options = {
    body,
    tag,
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    vibrate: [40, 30, 60],
    renotify: Boolean(data.renotify),
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/home";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // If a window is already open, focus it and route it to the target URL.
      for (const client of all) {
        try {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          } else if (client.postMessage) {
            client.postMessage({ type: "aiah-push-nav", url: targetUrl });
          }
          return;
        } catch {
          /* try next */
        }
      }
      // Otherwise open a new one.
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
