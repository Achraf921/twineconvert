"use client";

/**
 * Format-chip preview widget. Mirrors CloudConvert's hero pattern:
 * two square format chips (input + output) connected by a "TO" sync
 * button. Surrounded by faint concentric pink rings (the .rings
 * decoration). Cycles through popular conversion pairs every 3.5s.
 *
 * Restrained on purpose, single calm rotation, no thread weaving,
 * no animated knot, no flip cards. The visual interest comes from
 * the format identity (icon + label) and the rings backdrop.
 */

import { useEffect, useState } from "react";

type Pair = { from: string; to: string; ext: string };

const PAIRS: Pair[] = [
  { from: "HEIC", to: "JPG",      ext: "image" },
  { from: "PDF",  to: "DOCX",     ext: "doc" },
  { from: "MP4",  to: "MP3",      ext: "audio" },
  { from: "XLSX", to: "CSV",      ext: "sheet" },
  { from: "WEBP", to: "PNG",      ext: "image" },
  { from: "MOV",  to: "MP4",      ext: "video" },
  { from: "EPUB", to: "PDF",      ext: "doc" },
  { from: "OFX",  to: "CSV",      ext: "sheet" },
  { from: "DOC",  to: "PDF",      ext: "doc" },
];

export function HeroFlow() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setIndex((i) => (i + 1) % PAIRS.length);
        setPhase("in");
      }, 280);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const pair = PAIRS[index];

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Concentric pink rings backdrop */}
      <div className="rings absolute -inset-32 pointer-events-none" aria-hidden />

      <div className="relative flex items-center justify-center gap-3 sm:gap-4">
        <FormatChip label={pair.from} kind={pair.ext} side="from" phase={phase} />
        <ToButton />
        <FormatChip label={pair.to} kind={pair.ext} side="to" phase={phase} />
      </div>
    </div>
  );
}

function FormatChip({
  label,
  kind,
  side,
  phase,
}: {
  label: string;
  kind: string;
  side: "from" | "to";
  phase: "in" | "out";
}) {
  const accented = side === "to";
  return (
    <div
      key={`${label}-${side}`}
      className={`relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border transition-all duration-300 ${
        accented
          ? "bg-gradient-to-br from-[var(--color-pink-50)] to-white border-[var(--color-pink-300)] shadow-[var(--shadow-md)]"
          : "bg-white border-[var(--color-border)] shadow-[var(--shadow-sm)]"
      }`}
      style={{
        animation:
          phase === "out"
            ? "chip-swap-out 280ms var(--ease-out) forwards"
            : "chip-swap-in 280ms var(--ease-spring) forwards",
      }}
    >
      <FileGlyph kind={kind} accented={accented} />
      <span className="mt-3 text-[15px] font-bold tracking-wide text-[var(--color-ink)]">
        {label}
      </span>
      {/* Tiny chevron, visual rhyme with CloudConvert's dropdown affordance */}
      <span className="absolute bottom-2 right-3 text-[var(--color-ink-3)]" aria-hidden>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

function ToButton() {
  return (
    <div className="relative shrink-0">
      <div className="absolute inset-0 rounded-full bg-[var(--color-pink-600)] opacity-25 blur-md" aria-hidden />
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-pink-600)] text-white shadow-[var(--shadow-pink)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="slow-spin">
          <path
            d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
        to
      </div>
    </div>
  );
}

function FileGlyph({ kind, accented }: { kind: string; accented: boolean }) {
  // Generic file-card icon used for every format kind. CloudConvert
  // uses a different glyph per family; we keep it consistent because
  // the FORMAT NAME is the primary signal.
  const stroke = accented ? "var(--color-pink-700)" : "var(--color-ink-2)";
  const map: Record<string, React.ReactNode> = {
    image: (
      <>
        <rect x="6" y="6" width="20" height="20" rx="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="13" r="2" stroke={stroke} strokeWidth="1.5" fill="none" />
        <path d="M6 22 l5 -5 4 3 4 -4 7 6" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    doc: (
      <>
        <path d="M8 4 H 19 L 24 9 V 28 H 8 Z" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <path d="M19 4 V 9 H 24" stroke={stroke} strokeWidth="1.5" fill="none" />
        <line x1="11" y1="14" x2="21" y2="14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="18" x2="21" y2="18" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="22" x2="17" y2="22" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    sheet: (
      <>
        <rect x="6" y="6" width="20" height="20" rx="2" stroke={stroke} strokeWidth="1.5" fill="none" />
        <line x1="6"  y1="13" x2="26" y2="13" stroke={stroke} strokeWidth="1.5" />
        <line x1="6"  y1="20" x2="26" y2="20" stroke={stroke} strokeWidth="1.5" />
        <line x1="13" y1="6"  x2="13" y2="26" stroke={stroke} strokeWidth="1.5" />
        <line x1="19" y1="6"  x2="19" y2="26" stroke={stroke} strokeWidth="1.5" />
      </>
    ),
    audio: (
      <>
        <path d="M11 22 V 10 L 22 8 V 20" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="22" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="2.5" stroke={stroke} strokeWidth="1.5" fill="none" />
      </>
    ),
    video: (
      <>
        <rect x="5" y="9" width="18" height="14" rx="2" stroke={stroke} strokeWidth="1.5" fill="none" />
        <path d="M23 14 L 28 11 V 21 L 23 18" stroke={stroke} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </>
    ),
  };
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      {map[kind] ?? map.doc}
    </svg>
  );
}
