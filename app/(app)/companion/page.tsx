import { Header } from "@/components/layout/Header";
import { CompanionSetup } from "@/components/companion/CompanionSetup";

export default function CompanionPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Companion" />
      <CompanionSetup />
    </div>
  );
}
