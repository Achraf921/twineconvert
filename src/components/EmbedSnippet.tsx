"use client";

import { useState } from "react";

/**
 * "Embed this on your site" affordance for the tool pages. Shows a
 * copy-paste-able iframe snippet pointing at /embed/<toolId>. Each
 * embed someone deploys is a permanent backlink, which is the whole
 * point of having this here.
 */

interface Props {
  toolId: string;
  toolLabel: string;
}

export function EmbedSnippet({ toolId, toolLabel }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const snippet = `<iframe
  src="https://twineconvert.com/embed/${toolId}"
  width="100%"
  height="520"
  style="border:0;border-radius:12px;max-width:640px;"
  allow="clipboard-write"
  title="${toolLabel} converter by twineconvert">
</iframe>`;

  const onCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left flex items-center justify-between gap-3"
      >
        <span className="font-semibold text-[var(--color-text)]">
          Embed this {toolLabel} converter on your site
        </span>
        <span
          aria-hidden
          className={`text-[var(--color-ink-3)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-sm text-[var(--color-text-2)] mb-3">
            Free for any site. The widget runs entirely in your visitor&apos;s
            browser, so files never upload to your server or ours.
          </p>
          <pre className="text-xs bg-white border border-[var(--color-border)] rounded-md p-3 overflow-x-auto whitespace-pre">
            <code>{snippet}</code>
          </pre>
          <button
            type="button"
            onClick={onCopy}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-pink-600)] hover:bg-[var(--color-pink-700)] text-white text-sm font-semibold transition-colors"
          >
            {copied ? "Copied!" : "Copy embed code"}
          </button>
        </div>
      )}
    </div>
  );
}
