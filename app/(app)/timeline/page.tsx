import { Header } from "@/components/layout/Header";
import { TimelineJournal } from "@/components/modules/TimelineJournal";

export default function TimelinePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Timeline" />
      <TimelineJournal />
    </div>
  );
}
