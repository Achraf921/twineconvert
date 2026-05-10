"use client";

/**
 * Homepage dropzone, mirrors CloudConvert's "drop any file, we'll
 * route you" affordance. Detects the file's extension, finds tools
 * that accept it, and either routes immediately (single match) or
 * shows a small picker (multiple outputs available).
 *
 * Functional, not just a visual prop. The Select File button opens
 * the native picker; drag/drop is also supported.
 */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** Pre-built routing table: extension (e.g. ".heic") to list of matching tool IDs. */
  routes: Record<string, Array<{ id: string; label: string }>>;
  /** Every accepted extension across all tools, used for the file picker. */
  acceptAll: string[];
}

export function HomeDropzone({ routes, acceptAll }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [picker, setPicker] = useState<Array<{ id: string; label: string }> | null>(null);
  const [pickedExt, setPickedExt] = useState<string>("");

  const handleFile = useCallback(
    (file: File) => {
      const lower = file.name.toLowerCase();
      const ext = lower.includes(".") ? `.${lower.split(".").pop()}` : "";
      const matches = ext ? routes[ext] : undefined;
      if (!matches || matches.length === 0) {
        alert(
          `We don't have a converter for ${ext || "files without an extension"} yet. Try one of the categories below.`,
        );
        return;
      }
      if (matches.length === 1) {
        router.push(`/${matches[0].id}`);
        return;
      }
      setPicker(matches);
      setPickedExt(ext);
    },
    [routes, router],
  );

  const onPick = () => inputRef.current?.click();

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="relative w-full flex">
      <input
        ref={inputRef}
        type="file"
        accept={acceptAll.join(",")}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <div
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "dropzone-active"
            : "border-[var(--color-border-2)] bg-white hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)]/30 shadow-[var(--shadow-md)]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {/* Horizontal layout: icon left, copy middle, CTA right. This keeps
         *  the visible mass of the dropzone adjacent to the chip widget
         *  rather than centered inside a large empty box. */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-5 sm:px-6 py-7 sm:py-8 text-center sm:text-left">
          <CloudArrowUp />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-ink)] leading-snug">
              Select your file here to get started
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-3)]">
              or drop your file here.
            </p>
          </div>
          <button
            onClick={onPick}
            className="shrink-0 inline-flex items-center gap-3 bg-[var(--color-pink-600)] hover:bg-[var(--color-pink-700)] text-white font-semibold pl-5 pr-2 py-3 rounded-xl shadow-[var(--shadow-pink)] transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <FileWithPlus />
              Select File
            </span>
            <span className="border-l border-white/20 pl-2 py-1 inline-flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {picker && (
        <PickerOverlay
          ext={pickedExt}
          options={picker}
          onClose={() => setPicker(null)}
          onPick={(id) => router.push(`/${id}`)}
        />
      )}
    </div>
  );
}

function PickerOverlay({
  ext,
  options,
  onClose,
  onPick,
}: {
  ext: string;
  options: Array<{ id: string; label: string }>;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--color-ink)]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose output format"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-[var(--color-ink-3)] hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-pink-700)]">
          {ext} file
        </p>
        <h3 className="text-2xl font-bold mt-2 tracking-tight">
          What should we convert it to?
        </h3>
        <p className="text-sm text-[var(--color-ink-3)] mt-1">
          Pick the output format. Your file stays in this tab, no upload.
        </p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id)}
              className="lift text-left px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white hover:bg-[var(--color-pink-50)] hover:text-[var(--color-pink-700)] text-sm font-semibold text-[var(--color-ink-2)]"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CloudArrowUp() {
  return (
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-pink-50)] border border-[var(--color-pink-100)]">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M9 20a5 5 0 0 1 .8 -9.95 7.5 7.5 0 0 1 14.4 2.5 4.5 4.5 0 0 1 -1.2 8.95"
          stroke="#E0297B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 14v12M11 19l5 -5 5 5"
          stroke="#E0297B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FileWithPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

