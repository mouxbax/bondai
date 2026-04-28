import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { WelcomeSplash } from "@/components/companion/WelcomeSplash";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIAH — Your AI Life System",
  description:
    "The AI that manages your schedule, budget, goals, training, and growth — all in one place.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://aiah.app"),
  alternates: {
    canonical: "https://aiah.app",
  },
  openGraph: {
    title: "AIAH — Your AI Life System",
    description:
      "The AI that manages your schedule, budget, goals, training, and growth — all in one place.",
    url: "https://aiah.app",
    siteName: "AIAH",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://aiah.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "AIAH — AI life system for schedule, budget, goals, and growth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIAH — Your AI Life System",
    description:
      "The AI that manages your schedule, budget, goals, training, and growth — all in one place.",
    images: ["https://aiah.app/twitter-image.png"],
  },
  appleWebApp: { capable: true, title: "AIAH", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1210" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MCK66Z5R');`,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-[100dvh] font-sans antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MCK66Z5R"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>
          <WelcomeSplash />
          {children}
        </Providers>
      </body>
    </html>
  );
}
