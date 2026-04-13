// This debug endpoint has been intentionally disabled.
// Delete this file entirely before production.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Debug endpoint disabled." }, { status: 404 });
}
