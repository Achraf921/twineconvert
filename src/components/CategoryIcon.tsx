/**
 * Custom SVG illustrations for each homepage category. Replaces emoji
 * (which read as childish on a dense pro-grade page). Each icon is a
 * thin-line illustration in pink with a single decorative twine thread
 * weaving through it — extending the brand motif into every category.
 */

const ICONS: Record<string, React.ReactNode> = {
  // Image: stacked picture frames with a circular "knot"
  image: (
    <>
      <rect x="8" y="14" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="14" y="8" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <circle cx="32" cy="22" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M14 36 L24 28 L32 34 L42 24 L48 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M4 4 Q 12 12, 20 6 T 36 8" stroke="#E0297B" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
    </>
  ),

  // PDF & Documents: a folded document with text rules
  document: (
    <>
      <path d="M12 6 L 36 6 L 46 16 L 46 50 L 12 50 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M36 6 L 36 16 L 46 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <line x1="18" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 12 Q 10 6, 18 14" stroke="#E0297B" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
    </>
  ),

  // Audio & Video: stacked play triangle + waveform
  media: (
    <>
      <rect x="6" y="14" width="44" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M22 22 L 34 28 L 22 34 Z" fill="currentColor" />
      <path d="M2 8 L 8 8 M14 8 L 18 8 M24 8 L 32 8 M38 8 L 44 8 M50 8 L 56 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M-2 50 Q 8 42, 18 50 T 38 50 T 58 50" stroke="#E0297B" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />
    </>
  ),

  // EPUB & E-readers: open book with bookmark
  ereaders: (
    <>
      <path d="M28 12 L 28 46 M8 14 Q 18 8, 28 12 Q 38 8, 48 14 L 48 44 Q 38 38, 28 42 Q 18 38, 8 44 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <line x1="14" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="28" x2="22" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="28" x2="42" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44 6 L 44 18 L 40 14 L 36 18 L 36 6 Z" fill="#E0297B" />
    </>
  ),

  // Personal data exports: padlock + circuit lines
  personal: (
    <>
      <rect x="14" y="22" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M20 22 L 20 16 Q 20 8, 28 8 Q 36 8, 36 16 L 36 22" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="28" cy="32" r="2.5" fill="currentColor" />
      <line x1="28" y1="34" x2="28" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 4 Q 8 8, 6 14 T 4 24" stroke="#E0297B" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M50 36 Q 56 40, 54 46" stroke="#E0297B" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
    </>
  ),

  // Email & finance: envelope with receipt tail
  finance: (
    <>
      <rect x="6" y="10" width="44" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M6 14 L 28 28 L 50 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M16 38 L 16 52 L 22 48 L 28 52 L 34 48 L 40 52 L 40 38" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <line x1="20" y1="44" x2="36" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </>
  ),

  // Genealogy / research: branching tree
  research: (
    <>
      <circle cx="28" cy="10" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="42" cy="26" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="8"  cy="44" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="22" cy="44" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="36" cy="44" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="50" cy="44" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M28 14 L 28 18 L 14 22 M28 18 L 42 22 M14 30 L 14 36 L 8 40 M14 36 L 22 40 M42 30 L 42 36 L 36 40 M42 36 L 50 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  ),

  // Creative: nested shapes (color swatch / 3D wireframe / staff lines)
  creative: (
    <>
      <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="28" y="6" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" rx="1" />
      <path d="M6 38 L 28 38 L 28 50 L 6 50 Z M 28 38 L 38 32 L 38 44 L 28 50" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <line x1="36" y1="38" x2="52" y2="38" stroke="#E0297B" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="44" x2="52" y2="44" stroke="#E0297B" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="50" x2="52" y2="50" stroke="#E0297B" strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  // Architecture / B2B: building columns + isometric
  professional: (
    <>
      <path d="M8 44 L 28 12 L 48 44 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <line x1="20" y1="44" x2="20" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="36" y1="44" x2="36" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="28" y1="44" x2="28" y2="20" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="50" x2="52" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 50 4 Q 56 10, 50 16" stroke="#E0297B" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
    </>
  ),
};

export function CategoryIcon({ slug }: { slug: string }) {
  return (
    <div className="shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[var(--color-pink-50)] to-[var(--color-pink-100)] border border-[var(--color-pink-200)] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 56 56"
        fill="none"
        className="text-[var(--color-pink-700)] p-3"
        aria-hidden
      >
        {ICONS[slug] ?? <circle cx="28" cy="28" r="4" fill="currentColor" />}
      </svg>
      {/* Twine thread accent in the corner */}
      <svg
        className="absolute -top-1 -right-1 w-5 h-5 text-[var(--color-pink-500)] opacity-70 group-hover:opacity-100 transition-opacity"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden
      >
        <circle cx="7" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
