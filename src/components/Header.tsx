import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";

/**
 * Site header. Sticky, white background, subtle bottom border. CC pattern.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="twineconvert home">
          <Logo />
          <span className="font-bold text-[15px] tracking-tight text-[var(--color-ink)]">
            twineconvert
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <NavLink href="/all-tools">Tools</NavLink>
          <NavLink href="/#privacy">Privacy</NavLink>
          <NavLink href="/#why">Why in-browser</NavLink>
          <NavLink href="/#faq">FAQ</NavLink>
          <Link
            href="/all-tools"
            className="ml-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--color-pink-600)] hover:bg-[var(--color-pink-700)] text-white text-xs font-semibold transition-colors"
          >
            Browse all
          </Link>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

function Logo() {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={32}
      height={32}
      priority
      className="transition-transform duration-300 group-hover:rotate-12"
    />
  );
}
