import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[#FAFAF8] dark:bg-[#0f1412]">{children}</div>;
}
