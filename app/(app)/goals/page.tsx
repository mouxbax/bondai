import { Header } from "@/components/layout/Header";
import { GoalList } from "@/components/goals/GoalList";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Goals" />
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6">
        <GoalList />
      </div>
    </div>
  );
}
