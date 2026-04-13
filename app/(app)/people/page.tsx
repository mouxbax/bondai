import { Header } from "@/components/layout/Header";
import { PeopleModule } from "@/components/modules/PeopleModule";

export default function PeoplePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="People" />
      <PeopleModule />
    </div>
  );
}
