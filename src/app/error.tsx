"use client";

/**
 * Global error boundary for the App Router. Catches any runtime
 * exception that bubbles up from a server component, route handler,
 * or client component during navigation. Without this, Next.js shows
 * a default ugly error page.
 *
 * Specifically NOT a catch-all for converter errors — those are caught
 * inside the Dropzone component and shown inline. This is for the
 * unexpected stuff: a routing typo, a registry-meta mismatch, a
 * react-rendering exception.
 */

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // The error message is logged automatically by Vercel; this is just
    // a hook for future analytics integration when we wire one up.
    if (typeof window !== "undefined") {
      console.error("Page error:", error.message);
    }
  }, [error]);

  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="text-[var(--color-pink-600)] font-semibold text-sm tracking-wider uppercase">
        Something went wrong
      </p>
      <h1 className="text-3xl font-extrabold mt-3">Page error</h1>
      <p className="mt-4 text-[var(--color-text-2)]">
        We hit an unexpected issue rendering this page. Trying again usually
        works; if it doesn&apos;t, drop into the conversion you needed
        directly from the home page.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-[var(--color-text-3)]">
          Error reference: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-10 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-[var(--color-pink-600)] text-white font-medium px-6 py-3 rounded-lg shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-700)] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="font-medium px-6 py-3 rounded-lg border border-[var(--color-border-2)] hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
