import Link from "next/link";
import { MobileMenu } from "./MobileMenu";

/**
 * Site header. Sticky, paper-toned with a thin pink line as the bottom
 * border (the brand signature). Desktop nav inline; mobile gets a
 * hamburger via MobileMenu (client island). Logo animates the twine-knot
 * on hover (the two circles interlock visually with a rotation).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-paper)]/85 border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="twineconvert home">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)]">
            twineconvert
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <NavLink href="/all-tools">All tools</NavLink>
          <NavLink href="/#privacy">Privacy</NavLink>
          <NavLink href="/#why">Why in-browser</NavLink>
          <NavLink href="/#faq">FAQ</NavLink>
          <a
            href="https://github.com/Achraf921/conversionEngine"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--color-ink)] text-white text-xs font-bold tracking-wide hover:bg-[var(--color-pink-700)] transition-colors"
          >
            <GitHubGlyph />
            Source
          </a>
        </nav>

        <MobileMenu />
      </div>
      {/* Hairline pink accent line under the header, the brand signature */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-pink-300)] to-transparent" aria-hidden />
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-full text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-pink-50)] transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

function GitHubGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48 0-.24-.01-1.02-.01-1.85-2.78.5-3.51-.68-3.74-1.3-.13-.33-.69-1.3-1.18-1.56-.4-.21-.97-.74-.01-.76.91-.01 1.55.83 1.77 1.18 1.04 1.74 2.7 1.25 3.36.95.1-.74.4-1.25.73-1.54-2.46-.28-5.04-1.23-5.04-5.46 0-1.21.43-2.21 1.13-2.99-.11-.28-.49-1.41.11-2.93 0 0 .92-.29 3.02 1.14a10.36 10.36 0 0 1 5.5 0c2.1-1.43 3.02-1.14 3.02-1.14.6 1.52.22 2.65.11 2.93.7.78 1.13 1.78 1.13 2.99 0 4.24-2.59 5.18-5.05 5.46.4.34.74 1.01.74 2.04 0 1.47-.01 2.66-.01 3.03 0 .26.18.58.69.48A10.02 10.02 0 0 0 22 12c0-5.52-4.48-10-10-10Z"/>
    </svg>
  );
}

/** Logo: pink twine knot built from two interlocking circles + a center
 *  bead. On hover the two circles rotate ~12deg producing a literal
 *  knot-tightening illusion. */
function Logo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:rotate-[15deg]"
    >
      <circle cx="11" cy="16" r="7.5" stroke="#E0297B" strokeWidth="2.5" />
      <circle cx="21" cy="16" r="7.5" stroke="#E0297B" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="2.5" fill="#E0297B" />
    </svg>
  );
}
