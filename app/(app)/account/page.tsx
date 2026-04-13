import { Header } from "@/components/layout/Header";
import { AccountClient } from "@/components/account/AccountClient";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Your account" />
      <AccountClient />
    </div>
  );
}
