// Minimal email wrapper. Uses Resend if RESEND_API_KEY is set,
// otherwise logs the email to the server console (useful for local dev).

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FROM = process.env.EMAIL_FROM || "AIAH <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aiah.app";

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  console.log("[sendEmail] called — to:", to, "subject:", subject);
  console.log("[sendEmail] RESEND_API_KEY present:", !!apiKey, "EMAIL_FROM:", FROM);

  if (!apiKey) {
    console.log("[sendEmail] NO API KEY — email not sent, logging only");
    return { ok: true };
  }

  try {
    const payload = {
      from: FROM,
      to: [to],
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ""),
    };
    console.log("[sendEmail] sending via Resend...");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text().catch(() => "");
    console.log("[sendEmail] Resend response:", res.status, body);
    if (!res.ok) {
      return { ok: false, error: `Resend error ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[sendEmail] exception:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

// ─── Shared template helpers ────────────────────────────────────────────

const BTN = `display:inline-block;background-color:#1D9E75;color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;`;

function firstName(name?: string | null): string {
  if (!name) return "there";
  const first = name.split(" ")[0]?.trim();
  return first || "there";
}

interface LayoutOpts {
  preheader?: string;
  body: string; // inner HTML
  showFooterUnsubscribe?: boolean;
}

function layout({ preheader, body, showFooterUnsubscribe }: LayoutOpts): string {
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${preheader}</div>`
    : "";
  const unsub = showFooterUnsubscribe
    ? `<br><a href="${APP_URL}/account" style="color:#78716c;text-decoration:underline;">Manage email preferences</a>`
    : "";
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
    ${pre}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafaf8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
            <tr>
              <td style="padding:8px 8px 24px 8px;">
                <div style="font-size:24px;font-weight:700;color:#1D9E75;letter-spacing:-0.01em;">AIAH</div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #ece9e3;border-radius:14px;padding:32px 28px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px;color:#78716c;font-size:12px;line-height:1.6;">
                AIAH · Built with care${unsub}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

// ─── Templates ──────────────────────────────────────────────────────────

export function welcomeEmail(name?: string | null): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `Welcome to AIAH, ${fn}`;
  const text = `Hey ${fn},

Glad you're here. AIAH is your quiet companion — daily check-ins, mood tracking, and someone to talk to when life feels heavy.

Open AIAH: ${APP_URL}/home

Everything you share stays between us.

— AIAH`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#1c1917;">Welcome, ${fn}.</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px 0;color:#1c1917;">
      Glad you're here. AIAH is a quiet companion — gentle daily check-ins,
      mood tracking, and someone to talk to when the day feels heavy.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;color:#1c1917;">
      Start by telling AIAH how you're feeling. Small steps. No pressure.
    </p>
    <a href="${APP_URL}/home" style="${BTN}">Open AIAH</a>
    <p style="font-size:14px;line-height:1.6;color:#78716c;margin:28px 0 0 0;">
      Everything you share stays between us.
    </p>
  `;
  return { subject, html: layout({ preheader: `Welcome to AIAH — your quiet companion.`, body }), text };
}

export function emailVerificationEmail(
  name: string | null | undefined,
  verificationUrl: string,
): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `Verify your email`;
  const text = `Hey ${fn},

Just confirming it's you. Tap this link within 24 hours:

${verificationUrl}

— AIAH`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#1c1917;">Confirm it's you</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;color:#1c1917;">
      Hey ${fn}, just confirming it's you. This link expires in 24 hours.
    </p>
    <a href="${verificationUrl}" style="${BTN}">Verify email</a>
    <p style="font-size:13px;line-height:1.6;color:#78716c;margin:24px 0 0 0;word-break:break-all;">
      Or paste this URL into your browser:<br>${verificationUrl}
    </p>
  `;
  return { subject, html: layout({ preheader: `Verify your email to finish signing in.`, body }), text };
}

export function passwordResetEmail(
  resetUrl: string,
  name?: string | null,
): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `Reset your AIAH password`;
  const text = `Hey ${fn},

Someone asked to reset your AIAH password. If it was you, open this link in the next 60 minutes:

${resetUrl}

If it wasn't you, ignore this email — your password won't change.

— AIAH`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#1c1917;">Reset your password</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;color:#1c1917;">
      Hey ${fn} — if you asked to reset your password, tap below within 60 minutes.
    </p>
    <a href="${resetUrl}" style="${BTN}">Reset my password</a>
    <p style="font-size:13px;line-height:1.6;color:#78716c;margin:24px 0 0 0;word-break:break-all;">
      Or paste this URL into your browser:<br>${resetUrl}
    </p>
    <p style="font-size:14px;line-height:1.6;color:#78716c;margin:20px 0 0 0;">
      If you didn't ask for this, you can safely ignore this email.
    </p>
  `;
  return { subject, html: layout({ preheader: `Reset your AIAH password.`, body }), text };
}

export function passwordChangedEmail(
  name?: string | null,
): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `Your password was changed`;
  const text = `Hey ${fn},

Your AIAH password was just changed.

If this was you, you're all set.

If it wasn't you, reset your password immediately: ${APP_URL}/forgot-password

— AIAH`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#1c1917;">Password changed</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px 0;color:#1c1917;">
      Hey ${fn}, your AIAH password was just updated.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;color:#1c1917;">
      If this was you, no action needed. If it wasn't, reset it right away.
    </p>
    <a href="${APP_URL}/forgot-password" style="${BTN}">Reset password</a>
  `;
  return { subject, html: layout({ preheader: `Security notification: your password was changed.`, body }), text };
}

interface WeeklyDigestStats {
  checkins: number;
  streak: number;
  moodTrend: string;
  xpEarned: number;
}

export function weeklyDigestEmail(
  name: string | null | undefined,
  stats: WeeklyDigestStats,
): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `Your week with AIAH`;
  const lowActivity = stats.checkins === 0;
  const nudge = lowActivity
    ? "Even showing up counts. We'll be here when you're ready."
    : "Small wins compound. Keep going.";

  const text = `Hey ${fn},

Your week:
• ${stats.checkins} check-ins
• ${stats.streak}-day streak
• Mood: ${stats.moodTrend}
• ${stats.xpEarned} XP earned

${nudge}

See your insights: ${APP_URL}/insights

— AIAH`;

  const stat = (label: string, value: string) => `
    <td align="center" valign="top" style="padding:12px;background:#f7f5f0;border-radius:10px;">
      <div style="font-size:24px;font-weight:700;color:#1D9E75;">${value}</div>
      <div style="font-size:12px;color:#78716c;margin-top:2px;">${label}</div>
    </td>`;

  const body = `
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#1c1917;">Your week, ${fn}</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px 0;color:#1c1917;">
      A quick look at the last 7 days.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="6" border="0" style="margin:0 0 20px 0;">
      <tr>
        ${stat("Check-ins", String(stats.checkins))}
        ${stat("Day streak", String(stats.streak))}
      </tr>
      <tr>
        ${stat("Mood", stats.moodTrend)}
        ${stat("XP earned", String(stats.xpEarned))}
      </tr>
    </table>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px 0;color:#1c1917;">${nudge}</p>
    <a href="${APP_URL}/insights" style="${BTN}">See your insights</a>
  `;
  return { subject, html: layout({ preheader: `Your week with AIAH at a glance.`, body, showFooterUnsubscribe: true }), text };
}

export function nudgeEmail(
  name: string | null | undefined,
  message: string,
): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `Hey ${fn}, checking in`;
  const text = `Hey ${fn},

${message}

Talk to AIAH: ${APP_URL}/talk

— AIAH`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px 0;color:#1c1917;">Hey ${fn}.</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;color:#1c1917;">
      ${message}
    </p>
    <a href="${APP_URL}/talk" style="${BTN}">Talk to AIAH</a>
  `;
  return { subject, html: layout({ preheader: `Just a gentle check-in.`, body, showFooterUnsubscribe: true }), text };
}

/**
 * Sent right before a user's account is permanently deleted.
 * Tone: respectful. No CTA. One optional, very low-pressure feedback line.
 */
export function accountDeletedEmail(
  name?: string | null,
  feedbackUrl?: string,
): { subject: string; html: string; text: string } {
  const fn = firstName(name);
  const subject = `We'll miss you, ${fn}`;
  const feedbackLineText = feedbackUrl
    ? `\n\nIf you have a moment, we'd love to know why — ${feedbackUrl}`
    : "";
  const text = `${fn},

Your AIAH account and data have been deleted. If you ever want to come back, we'll be here.${feedbackLineText}

— AIAH`;

  const feedbackLineHtml = feedbackUrl
    ? `<p style="font-size:14px;line-height:1.6;color:#78716c;margin:16px 0 0 0;">
        If you have a moment, we'd love to know why — <a href="${feedbackUrl}" style="color:#1D9E75;">share feedback</a>.
      </p>`
    : "";

  const body = `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px 0;color:#1c1917;">${fn},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px 0;color:#1c1917;">
      Your AIAH account and data have been deleted.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 0 0;color:#1c1917;">
      If you ever want to come back, we'll be here.
    </p>
    ${feedbackLineHtml}
  `;
  return { subject, html: layout({ preheader: `Your AIAH account has been deleted.`, body }), text };
}
