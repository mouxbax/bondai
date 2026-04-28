import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { blogPosts, getPostBySlug, getAllSlugs } from "@/lib/blog/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const wordCount = post.content.split(/\s+/).length;
  return {
    title: `${post.title} | AIAH Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      url: `https://aiah.app/blog/${post.slug}`,
      siteName: "AIAH",
      images: [
        {
          url: "https://aiah.app/og-blog.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["https://aiah.app/og-blog.png"],
    },
    alternates: {
      canonical: `https://aiah.app/blog/${post.slug}`,
    },
    other: {
      "article:published_time": post.publishedAt,
      "article:section": post.category,
      "og:word_count": String(wordCount),
    },
  };
}

function ArticleJsonLd({ post }: { post: NonNullable<ReturnType<typeof getPostBySlug>> }) {
  const wordCount = post.content.split(/\s+/).length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: "https://aiah.app/og-blog.png",
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    wordCount,
    author: {
      "@type": "Organization",
      name: "AIAH",
      url: "https://aiah.app",
      logo: {
        "@type": "ImageObject",
        url: "https://aiah.app/icons/icon-512.png",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "AIAH",
      url: "https://aiah.app",
      logo: {
        "@type": "ImageObject",
        url: "https://aiah.app/icons/icon-512.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://aiah.app/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
    inLanguage: "en-US",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const currentIdx = blogPosts.findIndex((p) => p.slug === slug);
  const nextPost = blogPosts[currentIdx + 1] ?? blogPosts[0];
  const showNext = nextPost && nextPost.slug !== slug;

  // Convert markdown-ish content to HTML paragraphs
  const sections = post.content.split("\n\n").map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={i}
          className="mb-4 mt-10 text-xl font-semibold text-stone-100"
        >
          {trimmed.replace("## ", "")}
        </h2>
      );
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <p key={i} className="mb-4 font-medium text-stone-200">
          {trimmed.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (trimmed.startsWith("- ")) {
      const items = trimmed.split("\n").filter((l) => l.startsWith("- "));
      return (
        <ul key={i} className="mb-4 ml-4 list-disc space-y-2 text-stone-300">
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^- /, "").replace(/\*\*/g, "")}</li>
          ))}
        </ul>
      );
    }
    // Handle inline bold
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-4 leading-relaxed text-stone-300">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-medium text-stone-200">
              {part.replace(/\*\*/g, "")}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          ),
        )}
      </p>
    );
  });

  return (
    <div className="min-h-[100dvh] bg-background text-stone-800 dark:text-stone-100">
      <ArticleJsonLd post={post} />

      {/* Nav */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold text-emerald-400">
          AIAH
        </Link>
        <nav className="flex items-center gap-6 text-sm text-stone-400">
          <Link href="/blog" className="transition-colors hover:text-stone-200">
            Blog
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-4">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All articles
        </Link>

        <article>
          <span className="mb-4 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
            {post.category}
          </span>
          <h1 className="mb-4 text-2xl font-semibold leading-tight tracking-tight text-stone-50 sm:text-3xl">
            {post.title}
          </h1>
          <div className="mb-10 flex items-center gap-4 text-sm text-stone-500">
            <span>
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          </div>

          <div className="prose-dark">{sections}</div>
        </article>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-stone-100">
            AIAH is coming soon
          </h2>
          <p className="mx-auto mb-5 max-w-sm text-sm text-stone-400">
            One AI to manage your schedule, budget, goals, training, and
            growth. Join the waitlist to get early access.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(45,212,163,0.4)] transition-all hover:bg-emerald-400"
          >
            Join the waitlist
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Next article */}
        {showNext && (
          <Link
            href={`/blog/${nextPost.slug}`}
            className="mt-8 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]"
          >
            <div>
              <span className="text-xs text-stone-500">Next article</span>
              <p className="mt-1 font-medium text-stone-200">{nextPost.title}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-stone-500" />
          </Link>
        )}
      </main>
    </div>
  );
}
