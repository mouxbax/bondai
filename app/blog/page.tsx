import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { blogPosts } from "@/lib/blog/posts";
import { StatusBrand } from "@/components/layout/StatusBrand";

export const metadata: Metadata = {
  title: "Blog | AIAH - Your AI Life System",
  description:
    "Articles on productivity, life optimization, AI coaching, and how to build a system that manages your schedule, budget, goals, and growth.",
  alternates: {
    canonical: "https://aiah.app/blog",
  },
  openGraph: {
    title: "AIAH Blog | Life optimization, productivity & AI",
    description:
      "Articles on productivity, life optimization, AI coaching, and how to build a system that manages your schedule, budget, goals, and growth.",
    type: "website",
    url: "https://aiah.app/blog",
    images: [
      {
        url: "https://aiah.app/og-blog.png",
        width: 1200,
        height: 630,
        alt: "AIAH Blog - Insights on productivity, growth, and AI life coaching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIAH Blog | Life optimization, productivity & AI",
    description:
      "Articles on productivity, life optimization, AI coaching, and how to build a system that manages your schedule, budget, goals, and growth.",
    images: ["https://aiah.app/og-blog.png"],
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-stone-800 dark:text-stone-100" style={{ minHeight: "100dvh" }}>
      <StatusBrand />
      {/* Nav */}
      <header
        className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}
      >
        <Link href="/" className="text-lg font-semibold text-emerald-400">
          AIAH
        </Link>
        <nav className="flex items-center gap-6 text-sm text-stone-500 dark:text-stone-400">
          <Link href="/" className="transition-colors hover:text-stone-700 dark:hover:text-stone-200">
            Home
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-8">
        {/* Hero */}
        <div className="mb-12">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700 dark:hover:text-stone-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
            The AIAH blog
          </h1>
          <p className="mt-3 max-w-xl text-base text-stone-400">
            Ideas on productivity, life optimization, and how AI can help you
            build the system that unleashes your full potential.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-stone-200 bg-stone-50 p-6 transition-all hover:border-stone-300 hover:bg-stone-100 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05]"
            >
              <span className="mb-3 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                {post.category}
              </span>
              <h2 className="mb-2 text-lg font-medium leading-snug text-stone-800 transition-colors group-hover:text-stone-950 dark:text-stone-100 dark:group-hover:text-white">
                {post.title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-stone-400">
                {post.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-600 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-12">
          <h2 className="mb-3 text-xl font-semibold text-stone-800 dark:text-stone-100">
            AIAH is coming soon
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-stone-400">
            One AI to manage your schedule, budget, goals, training, and growth.
            Join the waitlist to get early access.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(45,212,163,0.4)] transition-all hover:bg-emerald-400"
          >
            Join the waitlist
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
