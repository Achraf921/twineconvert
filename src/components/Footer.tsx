import Link from "next/link";
import Image from "next/image";
import { BUY_ME_A_COFFEE_URL } from "@/lib/links";

/**
 * Site footer. Multi-column layout with category navigation (great
 * for both UX and as a sitewide internal-linking surface, every page
 * carries the full topic graph in its footer, which Google likes).
 */

const FOOTER_GROUPS = [
  {
    label: "Image",
    links: [
      { href: "/heic-to-jpg", label: "HEIC to JPG" },
      { href: "/png-to-webp", label: "PNG to WebP" },
      { href: "/jpg-to-png", label: "JPG to PNG" },
      { href: "/webp-to-png", label: "WebP to PNG" },
      { href: "/png-to-ico", label: "PNG to ICO" },
    ],
  },
  {
    label: "Document",
    links: [
      { href: "/pdf-to-jpg", label: "PDF to JPG" },
      { href: "/jpg-to-pdf", label: "JPG to PDF" },
      { href: "/docx-to-pdf", label: "DOCX to PDF" },
      { href: "/pdf-to-docx", label: "PDF to DOCX" },
      { href: "/compress-pdf", label: "Compress PDF" },
    ],
  },
  {
    label: "Audio · Video",
    links: [
      { href: "/mp4-to-mp3", label: "MP4 to MP3" },
      { href: "/mov-to-mp4", label: "MOV to MP4" },
      { href: "/wav-to-mp3", label: "WAV to MP3" },
      { href: "/mp4-to-gif", label: "MP4 to GIF" },
      { href: "/gif-to-mp4", label: "GIF to MP4" },
    ],
  },
  {
    label: "Pro · Niche",
    links: [
      { href: "/ofx-to-csv", label: "OFX to CSV" },
      { href: "/apple-health-to-csv", label: "Apple Health export" },
      { href: "/ifc-to-csv", label: "IFC quantity takeoff" },
      { href: "/gedcom-to-csv", label: "GEDCOM to CSV" },
      { href: "/dst-to-pes", label: "Embroidery DST/PES" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-24">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <FooterLogo />
              <span className="font-bold text-[15px] tracking-tight">twineconvert</span>
            </div>
            <p className="text-sm text-[var(--color-text-2)] leading-relaxed mb-4">
              Convert files in your browser. Nothing uploaded. No signup. No file size limit.
            </p>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-[1.03]"
              aria-label="Buy me a coffee"
            >
              <Image
                src="/buy-me-a-coffee.png"
                alt="Buy me a coffee"
                width={150}
                height={42}
                unoptimized
              />
            </a>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-3)] mb-3">
                {group.label}
              </h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-pink-600)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-[var(--color-text-3)]">
          <p>
            © {new Date().getFullYear()} twineconvert. Every conversion runs in your browser.
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            <Link href="/all-tools" className="hover:text-[var(--color-text)] transition-colors">
              All tools
            </Link>
            <Link href="/about" className="hover:text-[var(--color-text)] transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLogo() {
  return <Image src="/logo.png" alt="" width={24} height={24} />;
}
