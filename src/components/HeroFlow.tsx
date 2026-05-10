"use client";

/**
 * Hero visual: animated rotating display of "INPUT → TO → OUTPUT" format
 * pairs. Cycles through a curated list of popular conversions every few
 * seconds so the visitor immediately sees concrete examples of what the
 * tool does. Borrowed from CloudConvert's floating widget, it's a more
 * memorable hero than a static screenshot would be.
 *
 * Uses CSS transitions only (no animation library). Each rotation
 * crossfades + nudges the chips slightly so the change feels alive
 * but not distracting.
 */

import { useEffect, useState } from "react";

const PAIRS: Array<[string, string]> = [
  ["HEIC", "JPG"],
  ["PDF", "DOCX"],
  ["MP4", "MP3"],
  ["XLSX", "CSV"],
  ["WEBP", "PNG"],
  ["MOV", "MP4"],
  ["EPUB", "TXT"],
  ["OFX", "CSV"],
  ["GEDCOM", "CSV"],
  ["IFC", "GLTF"],
  ["DST", "PES"],
  ["MIDI", "MUSICXML"],
];

export function HeroFlow() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const tick = () => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PAIRS.length);
        setAnimating(false);
      }, 250);
    };
    const id = setInterval(tick, 2400);
    return () => clearInterval(id);
  }, []);

  const [from, to] = PAIRS[index];

  return (
    <div className="relative inline-flex items-center gap-3 sm:gap-5" aria-hidden="true">
      <Chip label={from} animating={animating} />
      <ArrowFlow animating={animating} />
      <Chip label={to} accent animating={animating} />
    </div>
  );
}

function Chip({ label, accent = false, animating }: { label: string; accent?: boolean; animating: boolean }) {
  return (
    <div
      className={`flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all duration-250 ${
        accent
          ? "bg-[var(--color-pink-600)] text-white shadow-[var(--shadow-pink)]"
          : "bg-white border border-[var(--color-border-2)] text-[var(--color-text)]"
      } ${animating ? "opacity-30 scale-95" : "opacity-100 scale-100"}`}
      style={{ transitionTimingFunction: "var(--ease-spring)" }}
    >
      <span className="font-bold tracking-tight text-sm sm:text-base">{label}</span>
    </div>
  );
}

function ArrowFlow({ animating }: { animating: boolean }) {
  return (
    <div className={`relative flex items-center justify-center transition-all duration-250 ${animating ? "scale-90 opacity-50" : "scale-100 opacity-100"}`} style={{ transitionTimingFunction: "var(--ease-spring)" }}>
      <div className="w-12 h-12 rounded-full bg-white border-2 border-[var(--color-pink-200)] flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M13 5l7 7-7 7"
            stroke="#E0297B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
