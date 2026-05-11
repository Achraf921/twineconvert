import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { LayoutShell } from "@/components/LayoutShell";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://twineconvert.com"),
  title: {
    default: "twineconvert, Convert Files in Your Browser",
    template: "%s · twineconvert",
  },
  description:
    "Free file converter that runs entirely in your browser. Convert HEIC, PDF, audio, video, archives, your files never leave your device. No upload, no signup, no file size limit.",
  keywords: [
    "file converter",
    "online converter",
    "client-side conversion",
    "browser file converter",
    "no upload converter",
    "free converter",
  ],
  authors: [{ name: "twineconvert" }],
  openGraph: {
    type: "website",
    siteName: "twineconvert",
    title: "twineconvert, Convert Files in Your Browser",
    description:
      "Free file converter that runs entirely in your browser. Your files never leave your device.",
    url: "https://twineconvert.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "twineconvert",
    description: "Convert files in your browser. Nothing uploaded.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://twineconvert.com",
  },
  other: {
    "theme-color": "#E0297B",
  },
};

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "twineconvert",
  url: "https://twineconvert.com",
  logo: "https://twineconvert.com/logo.png",
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "twineconvert",
  url: "https://twineconvert.com",
  description: "Free in-browser file converter, 192 tools, no upload, no signup.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://twineconvert.com/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        <LayoutShell>{children}</LayoutShell>
        <Analytics />
      </body>
    </html>
  );
}
