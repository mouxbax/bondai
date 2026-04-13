import { Header } from "@/components/layout/Header";
import { InsightsDashboard } from "@/components/insights/InsightsDashboard";

export default function InsightsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Insights" />
      <InsightsDashboard />
    </div>
  );
}
