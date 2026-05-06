import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingContent } from "@/components/landing/LandingHero";

function OrganizationSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AIAH",
    url: "https://aiah.app",
    logo: "https://aiah.app/icons/icon-512.png",
    description:
      "The AI that manages your schedule, budget, goals, training, and growth — all in one place.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@aiah.app",
      contactType: "customer support",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function WebSiteSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AIAH",
    url: "https://aiah.app",
    description:
      "AI life system that optimizes your schedule, meals, budget, goals, and training.",
    publisher: {
      "@type": "Organization",
      name: "AIAH",
      logo: {
        "@type": "ImageObject",
        url: "https://aiah.app/icons/icon-512.png",
      },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/home");
  }

  return (
    <div className="min-h-[100dvh] bg-background text-stone-900 dark:text-stone-50 overflow-hidden" style={{ minHeight: "100dvh" }}>
      <OrganizationSchema />
      <WebSiteSchema />
      <LandingContent />
    </div>
  );
}
