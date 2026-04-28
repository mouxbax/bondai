import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | AIAH",
  description: "The page you are looking for does not exist.",
  robots: "noindex, nofollow",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 text-6xl font-bold text-emerald-600/20 dark:text-emerald-400/20">404</div>
      <h1 className="mb-3 text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Page not found
      </h1>
      <p className="mb-8 max-w-sm text-sm text-stone-500 dark:text-stone-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
        >
          Back to home
        </Link>
        <Link
          href="/blog"
          className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-stone-300 dark:hover:bg-white/[0.08]"
        >
          Read the blog
        </Link>
      </div>
    </div>
  );
}
