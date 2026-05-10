"use client";

/**
 * Hero centerpiece: an animated "input format → output format" demo
 * where the two chips are connected by a woven pink thread (the brand
 * twine motif). Format pairs rotate every 3 seconds with a flip-card
 * transition. The thread re-draws on each swap.
 *
 * Built with CSS-only animations + a single useEffect for the
 * rotation tick. Respects prefers-reduced-motion.
 */

import { useEffect, useState } from "react";

const PAIRS: Array<[string, string, string]> = [
  // [input, output, descriptor for screen-readers]
  ["HEIC", "JPG", "iPhone photos to JPG"],
  ["PDF", "DOCX", "PDF to editable Word"],
  ["MP4", "MP3", "Extract audio from video"],
  ["XLSX", "CSV", "Spreadsheet to CSV"],
  ["WEBP", "PNG", "WebP to PNG"],
  ["MOV", "MP4", "iPhone video to MP4"],
  ["EPUB", "PDF", "E-book to PDF"],
  ["OFX", "CSV", "Bank statement to CSV"],
  ["GEDCOM", "CSV", "Family tree to spreadsheet"],
  ["IFC", "GLTF", "BIM model to 3D viewer"],
  ["DST", "PES", "Singer ↔ Brother embroidery"],
  ["MIDI", "MUSICXML", "MIDI to sheet music"],
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
      }, 320);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const [from, to, descriptor] = PAIRS[index];

  return (
    <div className="relative w-full max-w-md mx-auto" aria-label={descriptor}>
      <div className="relative flex items-stretch justify-center gap-3 sm:gap-4">
        <Chip label={from} kind="input" phase={phase} />

        {/* Woven pink thread connecting the two chips */}
        <div className="relative flex items-center justify-center w-16 sm:w-20">
          <svg
            viewBox="0 0 80 96"
            className="absolute inset-0 w-full h-full overflow-visible"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="thread" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF85BA" />
                <stop offset="50%" stopColor="#E0297B" />
                <stop offset="100%" stopColor="#FF85BA" />
              </linearGradient>
            </defs>
            {/* Two interleaved sine paths to suggest weaving */}
            <path
              d="M0 36 Q 20 12, 40 48 T 80 60"
              stroke="url(#thread)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.95"
            />
            <path
              d="M0 60 Q 20 84, 40 48 T 80 36"
              stroke="url(#thread)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* Tiny knot in the middle that pulses */}
            <circle cx="40" cy="48" r="6" fill="#E0297B" className="thread-knot" />
            <circle cx="40" cy="48" r="2.5" fill="#FFF" />
          </svg>
        </div>

        <Chip label={to} kind="output" phase={phase} />
      </div>

      <p className="mt-5 text-center text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-pink-500)] mr-2 align-middle pink-pulse" />
        live preview · {descriptor}
      </p>

      <style jsx>{`
        :global(.thread-knot) {
          transform-origin: 40px 48px;
          animation: knot-spin 4s linear infinite;
        }
        @keyframes knot-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Chip({
  label,
  kind,
  phase,
}: {
  label: string;
  kind: "input" | "output";
  phase: "in" | "out";
}) {
  const isOutput = kind === "output";
  return (
    <div
      className={`relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 transition-all duration-300 ${
        isOutput
          ? "bg-[var(--color-pink-500)] text-white border-[var(--color-pink-700)] shadow-[var(--shadow-pink)]"
          : "bg-white text-[var(--color-ink)] border-[var(--color-border-2)] shadow-[var(--shadow-md)]"
      }`}
      style={{
        animation:
          phase === "out"
            ? "chip-flip-out 320ms var(--ease-out) forwards"
            : "chip-flip-in 320ms var(--ease-bounce) forwards",
      }}
    >
      {/* Subtle file-corner fold detail */}
      <svg
        className={`absolute top-1.5 right-1.5 w-3 h-3 ${
          isOutput ? "text-pink-200" : "text-[var(--color-pink-500)]"
        }`}
        viewBox="0 0 12 12"
        aria-hidden
      >
        <path d="M0 0 L 12 0 L 12 12 Z" fill="currentColor" opacity="0.4" />
      </svg>
      <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
        {label}
      </span>
      <span
        className={`mt-0.5 text-[9px] font-mono uppercase tracking-[0.15em] ${
          isOutput ? "text-pink-100/80" : "text-[var(--color-ink-3)]"
        }`}
      >
        {isOutput ? "→ output" : "input"}
      </span>
    </div>
  );
}
