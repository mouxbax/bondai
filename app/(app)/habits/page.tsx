import { Header } from "@/components/layout/Header";
import { HabitsModule } from "@/components/modules/HabitsModule";

export default function HabitsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Habits" />
      <HabitsModule />
    </div>
  );
}
