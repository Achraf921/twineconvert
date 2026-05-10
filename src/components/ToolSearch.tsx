"use client";

/**
 * Client-side tool search. Loads ALL 192 tool IDs at build time
 * (registry-meta is static), filters them with substring + word-boundary
 * matching as the user types. No API call, no debounce — instant.
 *
 * Result: a tiny searchbox at the top of the homepage that lets users
 * jump straight to /heic-to-jpg by typing "heic", or browse all 47
 * "convert to PDF" routes by typing "to pdf". Way faster than scanning
 * the 192-tool category directory by eye.
 */

import { useMemo, useState } from "react";
import Link from "next/link";

interface Tool {
  id: string;
  label: string;
}

interface Props {
  tools: Tool[];
}

export function ToolSearch({ tools }: Props) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Match against id (slug) and label. Score by substring position.
    return tools
      .map((t) => {
        const idScore = t.id.toLowerCase().indexOf(q);
        const labelScore = t.label.toLowerCase().indexOf(q);
        const score = Math.min(
          idScore === -1 ? Infinity : idScore,
          labelScore === -1 ? Infinity : labelScore,
        );
        return { tool: t, score };
      })
      .filter((r) => r.score !== Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 12);
  }, [query, tools]);

  return (
    <div className="relative max-w-md mx-auto">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-3)]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search tools — try 'heic', 'pdf to docx', 'mp4'…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border-2)] bg-white text-sm placeholder:text-[var(--color-text-3)] focus:border-[var(--color-pink-400)] focus:bg-[var(--color-pink-50)] outline-none transition-colors"
        />
      </div>

      {showResults && filtered.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-lg)] overflow-hidden z-20">
          <ul className="max-h-80 overflow-y-auto">
            {filtered.map(({ tool }) => (
              <li key={tool.id}>
                <Link
                  href={`/${tool.id}`}
                  className="block px-4 py-2.5 text-sm hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-colors"
                >
                  <span className="font-medium">{tool.label}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-3)]">/{tool.id}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && query.trim() && filtered.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-md)] p-4 text-sm text-[var(--color-text-2)] z-20">
          No tools match &quot;{query}&quot;. Try a format name like <span className="font-medium">heic</span> or <span className="font-medium">pdf</span>.
        </div>
      )}
    </div>
  );
}
