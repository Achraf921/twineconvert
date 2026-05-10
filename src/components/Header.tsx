import Link from "next/link";
import { MobileMenu } from "./MobileMenu";

/**
 * Site header. Sticky on scroll with a soft border so it floats above
 * content without being heavy. Desktop nav inline; mobile gets a
 * hamburger via MobileMenu (client island).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label="twineconvert home">
          <Logo />
          <span className="font-bold text-[15px] tracking-tight">
            twineconvert
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-[var(--color-text-2)]">
          <Link href="/#tools" className="hover:text-[var(--color-text)] transition-colors">All tools</Link>
          <Link href="/#privacy" className="hover:text-[var(--color-text)] transition-colors">Privacy</Link>
          <Link href="/#why" className="hover:text-[var(--color-text)] transition-colors">Why in-browser</Link>
          <Link href="/#faq" className="hover:text-[var(--color-text)] transition-colors">FAQ</Link>
          <a
            href="https://github.com/Achraf921/conversionEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            Source
          </a>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}

/**
 * Logo: a pink "twine" knot built from two interlocking circles.
 * Inline SVG so it ships without an extra request and scales cleanly.
 */
function Logo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="transition-transform group-hover:rotate-12"
    >
      <circle cx="11" cy="16" r="7" stroke="#E0297B" strokeWidth="2.5" />
      <circle cx="21" cy="16" r="7" stroke="#E0297B" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="2" fill="#E0297B" />
    </svg>
  );
}
