"use client";

/**
 * Interactive format-pair picker. Two square chips (input + output)
 * connected by a circular swap button. Each chip opens a dropdown of
 * available formats; the OUTPUT chip's options are filtered to formats
 * that the current INPUT can actually convert to (a real graph, not a
 * static list). The TO button swaps input/output and navigates to the
 * reverse conversion's tool page.
 *
 * Centered above the homepage dropzone so the two affordances read as
 * one flow: pick a pair from the chips, or drop a file in the box.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormatGraph } from "@/lib/dropzone-routes";

interface Props {
  graph: FormatGraph;
  /** Initial input format. Defaults to "HEIC" if available, else the
   *  first input format alphabetically. */
  initialInput?: string;
  /** Initial output format. Must be a valid pair with initialInput. */
  initialOutput?: string;
}

export function HeroFlow({ graph, initialInput, initialOutput }: Props) {
  const router = useRouter();

  // Pick sensible defaults if the caller didn't specify (or specified
  // a pair that doesn't actually exist in the graph).
  const fallbackInput = useMemo(() => {
    if (initialInput && graph.outputsByInput[initialInput]) return initialInput;
    if (graph.outputsByInput["HEIC"]) return "HEIC";
    return graph.inputFormats[0] ?? "";
  }, [graph, initialInput]);

  const [input, setInput] = useState(fallbackInput);
  const outputsForInput = useMemo(
    () => graph.outputsByInput[input] ?? [],
    [graph, input],
  );

  const fallbackOutput = useMemo(() => {
    if (initialOutput && outputsForInput.some((o) => o.format === initialOutput)) {
      return initialOutput;
    }
    if (outputsForInput.some((o) => o.format === "JPG")) return "JPG";
    return outputsForInput[0]?.format ?? "";
  }, [outputsForInput, initialOutput]);

  const [output, setOutput] = useState(fallbackOutput);

  // Derive (don't useEffect+setState) the effective output: if the user's
  // last-picked output isn't valid for the current input, fall back to
  // the first available output. Avoids the cascading-render anti-pattern.
  const effectiveOutput = useMemo(
    () =>
      outputsForInput.some((o) => o.format === output)
        ? output
        : outputsForInput[0]?.format ?? "",
    [outputsForInput, output],
  );

  const currentToolId = graph.toolByPair[`${input}|${effectiveOutput}`];
  const reverseToolId = graph.toolByPair[`${effectiveOutput}|${input}`];
  const canReverse = Boolean(reverseToolId);

  const onPickInput = (next: string) => {
    setInput(next);
    // Try to keep the same output if the new input still supports it
    if (graph.toolByPair[`${next}|${output}`]) return;
    const firstOut = graph.outputsByInput[next]?.[0];
    if (firstOut) setOutput(firstOut.format);
  };

  const onPickOutput = (next: string) => {
    setOutput(next);
    const toolId = graph.toolByPair[`${input}|${next}`];
    if (toolId) router.push(`/${toolId}`);
  };

  const onSwap = () => {
    if (!reverseToolId) return;
    setInput(effectiveOutput);
    setOutput(input);
    router.push(`/${reverseToolId}`);
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Concentric pink rings backdrop */}
      <div className="rings absolute -inset-24 pointer-events-none" aria-hidden />

      <div className="relative flex items-center justify-center gap-3 sm:gap-4">
        <FormatChip
          label={input}
          options={graph.inputFormats}
          current={input}
          accented={false}
          onSelect={onPickInput}
        />

        <SwapButton onClick={onSwap} enabled={canReverse} from={input} to={effectiveOutput} />

        <FormatChip
          label={effectiveOutput}
          options={outputsForInput.map((o) => o.format)}
          current={effectiveOutput}
          accented={true}
          onSelect={onPickOutput}
        />
      </div>

      {/* CTA below the chips: explicit affordance so users who don't realise
       *  the chips are clickable still have a path forward. */}
      {currentToolId && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => router.push(`/${currentToolId}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-ink)] hover:bg-[var(--color-pink-700)] text-white text-sm font-semibold transition-colors"
          >
            Convert {input} to {effectiveOutput}
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  );
}

function FormatChip({
  label,
  options,
  current,
  accented,
  onSelect,
}: {
  label: string;
  options: string[];
  current: string;
  accented: boolean;
  onSelect: (format: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change ${accented ? "output" : "input"} format`}
        className={`relative flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
          accented
            ? "bg-gradient-to-br from-[var(--color-pink-50)] to-white border-[var(--color-pink-300)] shadow-[var(--shadow-md)] hover:border-[var(--color-pink-500)]"
            : "bg-white border-[var(--color-border-2)] shadow-[var(--shadow-sm)] hover:border-[var(--color-pink-300)]"
        }`}
      >
        <FileGlyph accented={accented} />
        <span className="mt-3 text-[15px] font-bold tracking-wide text-[var(--color-ink)]">
          {label}
        </span>
        <span
          className={`absolute bottom-2 right-3 text-[var(--color-ink-3)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 w-44 max-h-72 overflow-y-auto bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] py-1.5"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--color-ink-3)]">
              No formats available
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${
                  opt === current
                    ? "bg-[var(--color-pink-50)] text-[var(--color-pink-700)]"
                    : "hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] text-[var(--color-ink-2)]"
                }`}
                role="option"
                aria-selected={opt === current}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SwapButton({
  onClick,
  enabled,
  from,
  to,
}: {
  onClick: () => void;
  enabled: boolean;
  from: string;
  to: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      aria-label={enabled ? `Swap to ${to} to ${from}` : "Reverse conversion unavailable"}
      title={enabled ? `Swap to ${to} → ${from}` : "No reverse converter available"}
      className={`relative shrink-0 group ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
    >
      <div
        className={`absolute inset-0 rounded-full bg-[var(--color-pink-600)] blur-md transition-opacity ${
          enabled ? "opacity-25 group-hover:opacity-40" : "opacity-15"
        }`}
        aria-hidden
      />
      <div
        className={`relative flex items-center justify-center w-12 h-12 rounded-full text-white shadow-[var(--shadow-pink)] transition-all ${
          enabled ? "bg-[var(--color-pink-600)] group-hover:bg-[var(--color-pink-700)] group-hover:rotate-180" : "bg-[var(--color-pink-400)]"
        }`}
        style={{ transitionDuration: enabled ? "400ms" : "200ms" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-3)] whitespace-nowrap">
        {enabled ? "swap" : "to"}
      </div>
    </button>
  );
}

function FileGlyph({ accented }: { accented: boolean }) {
  const stroke = accented ? "var(--color-pink-700)" : "var(--color-ink-2)";
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M8 4 H 19 L 24 9 V 28 H 8 Z M 19 4 V 9 H 24"
        stroke={stroke}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      <line x1="11" y1="14" x2="21" y2="14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="18" x2="21" y2="18" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="22" x2="17" y2="22" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
