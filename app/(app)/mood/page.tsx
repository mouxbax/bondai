import { Header } from "@/components/layout/Header";
import { MoodJournal } from "@/components/modules/MoodJournal";

export default function MoodPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Mood" />
      <MoodJournal />
    </div>
  );
}
