import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Real metadata lands when the brand + landing page do.
  title: "client-conversion",
  description: "Engine scaffold — UI pending.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
