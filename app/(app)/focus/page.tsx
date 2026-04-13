import { Header } from "@/components/layout/Header";
import { FocusModule } from "@/components/modules/FocusModule";

export default function FocusPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Focus" />
      <FocusModule />
    </div>
  );
}
