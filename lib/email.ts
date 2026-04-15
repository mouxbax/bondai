// Minimal email wrapper. Uses Resend if RESEND_API_KEY is set,
// otherwise logs the email to the server console (useful for local dev).

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FROM = process.env.EMAIL_FROM || "AIAH <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback: log the email to the server console so you can still test.
    console.log("\n\n========== EMAIL (no RESEND_API_KEY set) ==========");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text || "(none)");
    console.log("HTML:", html);
    console.log("====================================================\n\n");
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
        text: text ?? html.replace(/<[^>]+>/g, ""),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend error ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

export function passwordResetEmail(resetUrl: string, name?: string | null): { subject: string; html: string; text: string } {
  const greet = name ? `Hey ${name.split(" ")[0]},` : "Hey,";
  const subject = "Reset your AIAH password";
  const text =
    `${greet}\n\n` +
    `Someone requested a password reset for your AIAH account.\n` +
    `If it was you, open this link within the next 60 minutes:\n\n` +
    `${resetUrl}\n\n` +
    `If it wasn't you, you can safely ignore this email.\n\n` +
    `- AIAH`;
  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf8f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="font-size:28px;font-weight:700;color:#1D9E75;margin-bottom:24px;">AIAH</div>
      <h1 style="font-size:22px;margin:0 0 16px 0;">Reset your password</h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 16px 0;">${greet}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        Someone requested a password reset for your AIAH account. If that was you, tap the button below within the next 60 minutes.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#1D9E75;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:16px;">Reset my password</a>
      <p style="font-size:14px;line-height:1.6;color:#666;margin:32px 0 0 0;">
        Or paste this link into your browser:<br>
        <span style="color:#1D9E75;word-break:break-all;">${resetUrl}</span>
      </p>
      <p style="font-size:14px;line-height:1.6;color:#666;margin:24px 0 0 0;">
        If you didn't request this, you can safely ignore this email - your password won't change.
      </p>
      <hr style="margin:32px 0;border:0;border-top:1px solid #e5e3df;">
      <p style="font-size:12px;color:#999;margin:0;">AIAH - your AI companion for a better day.</p>
    </div>
  </body>
</html>`.trim();
  return { subject, html, text };
}
