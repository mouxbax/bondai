import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createGoal, listGoals } from "@/lib/db/queries/goals";

/**
 * curl http://localhost:3000/api/goals -H "Cookie: ..."
 * curl -X POST http://localhost:3000/api/goals -H "Content-Type: application/json" \
 *   -d '{"title":"Hi neighbor","description":"Say hello"}' -H "Cookie: ..."
 */

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  targetDate: z.string().datetime().optional(),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const goals = await listGoals(session.user.id);
  return NextResponse.json({ goals });
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
  const g = await createGoal(session.user.id, {
    title: parsed.data.title,
    description: parsed.data.description,
    targetDate,
  });
  return NextResponse.json({ goal: g });
}
