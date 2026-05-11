"use client";

/**
 * Dropzone, the conversion UI.
 *
 * Client component because it needs:
 *   - drag/drop event handlers
 *   - file API access
 *   - converter loading + execution
 *   - state transitions (idle → file selected → converting → done | error)
 *
 * Visually mirrors CloudConvert's pattern (cloud icon + "Select your
 * file here" + "or drop your file here" + big primary CTA) but
 * styled to our white + pink brand.
 */

import { useCallback, useRef, useState } from "react";
import posthog from "posthog-js";
import { run } from "@/lib/engine/runner";

type Phase = "idle" | "ready" | "running" | "done" | "error";

/**
 * Bucket a byte size into a coarse class so analytics events don't carry
 * raw file sizes (privacy + cheaper to aggregate). The visit-to-download
 * funnel only needs to know if the file is tiny/small/medium/large.
 */
function sizeBucket(bytes: number): "tiny" | "small" | "medium" | "large" {
  if (bytes < 1024 * 1024) return "tiny";              // <1MB
  if (bytes < 10 * 1024 * 1024) return "small";        // 1-10MB
  if (bytes < 100 * 1024 * 1024) return "medium";      // 10-100MB
  return "large";                                       // >100MB
}

interface Props {
  /** Converter id from the registry, e.g. "heic-to-jpg". */
  toolId: string;
  /** Display label, e.g. "HEIC → JPG". */
  toolLabel: string;
  /** File extensions to accept on the file picker, e.g. [".heic", ".heif"]. */
  accept: string[];
}

export function Dropzone({ toolId, toolLabel, accept }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<{ blob: Blob; filename: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback(
    (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      // Funnel step 2 (pageview is auto-tracked). Logs which tool the user
      // is actually using vs just browsing. Comparing this against pageview
      // count gives us pageview-to-upload conversion rate.
      posthog.capture("file_selected", {
        tool: toolId,
        size: sizeBucket(f.size),
        mime: f.type || "unknown",
      });
      setFile(f);
      setOutput(null);
      setError(null);
      setProgress(0);
      setPhase("ready");
    },
    [toolId],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  const startConversion = useCallback(async () => {
    if (!file) return;
    // Funnel step 3: user committed to converting (vs just exploring).
    posthog.capture("convert_clicked", {
      tool: toolId,
      size: sizeBucket(file.size),
    });
    setPhase("running");
    setProgress(0);
    setError(null);
    const startedAt = performance.now();
    try {
      const result = await run(toolId, file, { onProgress: setProgress });
      setOutput(result);
      setPhase("done");
      // Funnel step 4: conversion actually finished. Duration buckets help
      // us spot which tools are slow enough to hurt completion rates.
      posthog.capture("convert_success", {
        tool: toolId,
        size: sizeBucket(file.size),
        duration_ms: Math.round(performance.now() - startedAt),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
      // Capture error class (not the raw message) so we can spot patterns
      // without leaking file content into the analytics stream.
      posthog.capture("convert_error", {
        tool: toolId,
        size: sizeBucket(file.size),
        error_class: e instanceof Error ? e.constructor.name : "Unknown",
      });
    }
  }, [file, toolId]);

  const downloadOutput = useCallback(() => {
    if (!output) return;
    // Funnel step 5 (terminal): user actually downloaded. This is the
    // metric that proves they got value from the tool, not just that the
    // conversion technically succeeded.
    posthog.capture("download_clicked", {
      tool: toolId,
      size: sizeBucket(output.blob.size),
    });
    const url = URL.createObjectURL(output.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = output.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [output, toolId]);

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setOutput(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="relative">
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
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
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />

      <div className="px-6 py-10 sm:py-12 text-center">
        {phase === "idle" && <IdleState onPick={() => inputRef.current?.click()} accept={accept} />}
        {phase === "ready" && file && (
          <ReadyState file={file} toolLabel={toolLabel} onConvert={startConversion} onCancel={reset} />
        )}
        {phase === "running" && file && <RunningState progress={progress} file={file} />}
        {phase === "done" && output && (
          <DoneState
            outputName={output.filename}
            outputSize={output.blob.size}
            onDownload={downloadOutput}
            onReset={reset}
          />
        )}
        {phase === "error" && (
          <ErrorState message={error ?? "Conversion failed."} onReset={reset} />
        )}
      </div>
      </div>
    </div>
  );
}

// ===== State sub-components =====

function IdleState({ onPick, accept }: { onPick: () => void; accept: string[] }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <CloudIcon />
      <div className="text-center">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Select your file here to get started
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-3)]">
          or drop your file here.
        </p>
      </div>
      <button
        onClick={onPick}
        className="mt-2 inline-flex items-center gap-3 bg-[var(--color-pink-600)] hover:bg-[var(--color-pink-700)] text-white font-semibold pl-5 pr-2 py-3 rounded-xl shadow-[var(--shadow-pink)] transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <FileIcon />
          Select File
        </span>
        <span className="border-l border-white/20 pl-2 py-1 inline-flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <p className="text-xs text-[var(--color-ink-3)]">
        Accepts {accept.slice(0, 4).join(", ")}
        {accept.length > 4 ? `, +${accept.length - 4} more` : ""}
      </p>
    </div>
  );
}

function ReadyState({
  file,
  toolLabel,
  onConvert,
  onCancel,
}: {
  file: File;
  toolLabel: string;
  onConvert: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <FileIconLarge />
      <div>
        <p className="font-medium text-[var(--color-text)]">{file.name}</p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          {formatBytes(file.size)} · ready to convert as {toolLabel}
        </p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onConvert}
          className="bg-[var(--color-pink-600)] text-white font-medium px-6 py-3 rounded-lg shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-700)] transition-colors"
        >
          Convert
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors px-4 py-3"
        >
          Pick a different file
        </button>
      </div>
    </div>
  );
}

function RunningState({ progress, file }: { progress: number; file: File }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <SpinnerIcon />
      <div>
        <p className="font-medium text-[var(--color-text)]">Converting {file.name}</p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          Running in your browser. Nothing leaves your device.
        </p>
      </div>
      <div className="w-full max-w-md mt-2 h-2 bg-[var(--color-pink-100)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-pink-600)] transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="text-xs text-[var(--color-text-3)]">{Math.round(progress * 100)}%</p>
    </div>
  );
}

function DoneState({
  outputName,
  outputSize,
  onDownload,
  onReset,
}: {
  outputName: string;
  outputSize: number;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CheckIcon />
      <div>
        <p className="font-medium text-[var(--color-text)]">Conversion complete</p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          {outputName} · {formatBytes(outputSize)}
        </p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onDownload}
          className="bg-[var(--color-pink-600)] text-white font-medium px-6 py-3 rounded-lg shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-700)] transition-colors inline-flex items-center gap-2"
        >
          <DownloadIcon />
          Download
        </button>
        <button
          onClick={onReset}
          className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors px-4 py-3"
        >
          Convert another
        </button>
      </div>
    </div>
  );
}

function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <ErrorIcon />
      <div className="max-w-md">
        <p className="font-medium text-[var(--color-text)]">Conversion failed</p>
        <p className="text-sm text-[var(--color-text-2)] mt-1">{message}</p>
      </div>
      <button
        onClick={onReset}
        className="text-sm bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] px-5 py-2.5 rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// ===== Icons =====

function CloudIcon() {
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

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M12 11v6M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIconLarge() {
  return (
    <div className="w-14 h-14 rounded-xl bg-[var(--color-pink-100)] flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          stroke="#E0297B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 2v6h6" stroke="#E0297B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <div className="w-14 h-14 rounded-full bg-[var(--color-pink-100)] flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="animate-spin">
        <path
          d="M21 12a9 9 0 11-6.219-8.56"
          stroke="#E0297B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-14 h-14 rounded-full bg-[var(--color-pink-100)] flex items-center justify-center pink-pulse">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="#E0297B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
        <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
