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
import { groupByCategory, type FormatCategory } from "@/lib/format-categories";

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
      {/* Concentric pink rings backdrop, matches CloudConvert's visual treatment */}
      <div className="rings absolute -inset-32 pointer-events-none" aria-hidden />

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
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Group the options into categories for the left sidebar.
  const grouped = useMemo(() => groupByCategory(options), [options]);

  // The category whose formats are visible in the right pane. Defaults to
  // the category containing the currently selected format, falling back to
  // the first category.
  const initialCategory = useMemo<FormatCategory | null>(() => {
    if (!grouped.length) return null;
    const owner = grouped.find((g) => g.formats.includes(current));
    return owner?.category ?? grouped[0].category;
  }, [grouped, current]);

  const [activeCategory, setActiveCategory] = useState<FormatCategory | null>(
    initialCategory,
  );
  // Track the last "initial" category so we can reset activeCategory when
  // the option set changes (e.g. input changes and the output dropdown
  // gets a new filtered list). Setting state during render — guarded by an
  // equality check — is the React-recommended pattern for this.
  const [prevInitial, setPrevInitial] = useState(initialCategory);
  if (prevInitial !== initialCategory) {
    setPrevInitial(initialCategory);
    setActiveCategory(initialCategory);
  }

  // Search overrides the category selection: when the user types, show
  // every matching format in a single flat grid regardless of category.
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toUpperCase();
    return options.filter((o) => o.toUpperCase().includes(q));
  }, [options, search]);

  const visibleFormats =
    searchResults ??
    grouped.find((g) => g.category === activeCategory)?.formats ??
    [];

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close();
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
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
        aria-haspopup="dialog"
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
          role="dialog"
          aria-label={`Pick ${accented ? "output" : "input"} format`}
          className={`absolute z-30 mt-2 w-[min(calc(100vw-2rem),28rem)] bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden ${
            accented ? "right-0" : "left-0"
          }`}
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-ink-3)] shrink-0">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search format"
              className="flex-1 bg-transparent text-sm placeholder:text-[var(--color-ink-3)] focus:outline-none"
              aria-label="Search formats"
            />
          </div>

          {/* Two-pane body */}
          <div className="flex h-64">
            {/* Left: categories */}
            <div className="w-32 border-r border-[var(--color-border)] overflow-y-auto py-1 bg-[var(--color-paper)]/50">
              {searchResults !== null ? (
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                  Results
                </div>
              ) : grouped.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--color-ink-3)]">
                  No formats
                </div>
              ) : (
                grouped.map(({ category }) => (
                  <button
                    key={category}
                    type="button"
                    onMouseEnter={() => setActiveCategory(category)}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                      category === activeCategory
                        ? "bg-white text-[var(--color-pink-700)] border-l-2 border-[var(--color-pink-600)]"
                        : "text-[var(--color-ink-2)] hover:bg-white hover:text-[var(--color-pink-700)] border-l-2 border-transparent"
                    }`}
                  >
                    {category}
                  </button>
                ))
              )}
            </div>

            {/* Right: format grid */}
            <div className="flex-1 overflow-y-auto p-2">
              {visibleFormats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--color-ink-3)]">
                  {searchResults !== null
                    ? `No format matches "${search}"`
                    : "No formats in this category"}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5" role="listbox">
                  {visibleFormats.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onSelect(opt);
                        close();
                      }}
                      role="option"
                      aria-selected={opt === current}
                      className={`text-center px-2 py-2 text-xs font-bold tracking-wide rounded-md border transition-colors ${
                        opt === current
                          ? "bg-[var(--color-pink-600)] border-[var(--color-pink-600)] text-white"
                          : "bg-white border-[var(--color-border)] text-[var(--color-ink-2)] hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
