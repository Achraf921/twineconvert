import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

/**
 * Root metadata. Per-tool pages override title/description with their
 * own `generateMetadata`. This is the fallback for any page that
 * doesn't set its own (homepage, 404).
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://twineconvert.com"),
  title: {
    default: "twineconvert — convert files in your browser",
    template: "%s · twineconvert",
  },
  description:
    "Free file converter that runs entirely in your browser. Convert HEIC, PDF, audio, video, archives — your files never leave your device. No upload, no signup, no file size limit.",
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
    title: "twineconvert — convert files in your browser",
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
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "https://twineconvert.com",
  },
  other: {
    "theme-color": "#E0297B",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
