import { Header } from "@/components/layout/Header";
import { AchievementsGrid } from "@/components/gamification/AchievementsGrid";

export default function AchievementsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Achievements" />
      <AchievementsGrid />
    </div>
  );
}
