import Link from "next/link";

const POPULAR = [
  { id: "heic-to-jpg", label: "HEIC → JPG" },
  { id: "pdf-to-jpg", label: "PDF → JPG" },
  { id: "mp4-to-mp3", label: "MP4 → MP3" },
  { id: "docx-to-pdf", label: "DOCX → PDF" },
  { id: "ofx-to-csv", label: "OFX → CSV" },
  { id: "apple-health-to-csv", label: "Apple Health → CSV" },
];

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-[var(--color-pink-600)] font-semibold text-sm tracking-wider uppercase">404</p>
      <h1 className="text-4xl font-extrabold mt-3">Couldn&apos;t find that converter</h1>
      <p className="mt-4 text-[var(--color-text-2)]">
        The URL you tried doesn&apos;t match any of our 193 converter routes.
        Maybe one of these is what you were looking for?
      </p>
      <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto">
        {POPULAR.map((p) => (
          <li key={p.id}>
            <Link
              href={`/${p.id}`}
              className="block px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] transition-all text-sm font-medium"
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="inline-block mt-10 text-[var(--color-pink-600)] hover:text-[var(--color-pink-700)] font-medium transition-colors"
      >
        ← Back to home
      </Link>
    </section>
  );
}
