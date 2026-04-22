import { NextResponse } from "next/server";

/**
 * Public endpoint — returns the VAPID public key so the browser
 * can subscribe for push. The private key never leaves the server.
 */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Push not configured. Set VAPID_PUBLIC_KEY on the server." },
      { status: 503 },
    );
  }
  return NextResponse.json({ key });
}
