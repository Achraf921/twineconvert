"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden -mr-2 p-2 rounded-md text-[var(--color-text-2)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          {open ? (
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-white border-t border-[var(--color-border)] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="px-6 py-6 flex flex-col gap-1">
            <MobileLink href="/" onSelect={() => setOpen(false)}>Home</MobileLink>
            <MobileLink href="/all-tools" onSelect={() => setOpen(false)}>All tools</MobileLink>
            <MobileLink href="/#privacy" onSelect={() => setOpen(false)}>Privacy promise</MobileLink>
            <MobileLink href="/#why" onSelect={() => setOpen(false)}>Why in-browser</MobileLink>
            <MobileLink href="/#faq" onSelect={() => setOpen(false)}>FAQ</MobileLink>

            <div className="my-4 border-t border-[var(--color-border)]" />

            <MobileLink href="/about" onSelect={() => setOpen(false)}>About</MobileLink>
            <MobileLink href="/privacy" onSelect={() => setOpen(false)}>Privacy policy</MobileLink>
            <MobileLink href="/terms" onSelect={() => setOpen(false)}>Terms</MobileLink>
          </nav>
        </div>
      )}
    </>
  );
}

function MobileLink({
  href,
  onSelect,
  children,
}: {
  href: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="block px-4 py-3 rounded-lg text-[var(--color-text-2)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-colors text-base font-medium"
    >
      {children}
    </Link>
  );
}
