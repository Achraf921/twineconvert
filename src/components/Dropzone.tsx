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
import { convertBatch, packageBatchZip } from "@/lib/engine/batch";

type Phase = "idle" | "ready" | "running" | "done" | "error";

/**
 * Per-file row in a batch run. Single-file conversions never use this; the
 * 1-file path stays on the original `file`/`output` state so its UI and
 * analytics are byte-identical to before batch existed.
 */
type BatchItem = {
  file: File;
  status: "pending" | "running" | "success" | "error";
  progress: number;
  output?: { blob: Blob; filename: string };
  error?: string;
};

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
  const [batch, setBatch] = useState<BatchItem[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback(
    (fileList: FileList | File[]) => {
      const picked = Array.from(fileList);
      if (picked.length === 0) return;

      if (picked.length === 1) {
        // Single-file path: unchanged from before batch. Same state, same
        // analytics event shape, so the 1-file experience is identical.
        const f = picked[0];
        // Funnel step 2 (pageview is auto-tracked). Logs which tool the user
        // is actually using vs just browsing. Comparing this against pageview
        // count gives us pageview-to-upload conversion rate.
        posthog.capture("file_selected", {
          tool: toolId,
          size: sizeBucket(f.size),
          mime: f.type || "unknown",
        });
        setBatch(null);
        setFile(f);
        setOutput(null);
        setError(null);
        setProgress(0);
        setPhase("ready");
        return;
      }

      // Batch path: 2+ files. One file_selected per file keeps the
      // pageview-to-upload funnel and per-mime stats consistent with the
      // single-file events; `batch_size` lets us segment batch usage.
      for (const f of picked) {
        posthog.capture("file_selected", {
          tool: toolId,
          size: sizeBucket(f.size),
          mime: f.type || "unknown",
          batch_size: picked.length,
        });
      }
      setFile(null);
      setOutput(null);
      setError(null);
      setProgress(0);
      setBatch(picked.map((f) => ({ file: f, status: "pending", progress: 0 })));
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

  const startBatch = useCallback(async () => {
    if (!batch || batch.length === 0) return;
    posthog.capture("convert_clicked", {
      tool: toolId,
      batch_size: batch.length,
    });
    setPhase("running");
    // Local mirror of batch state pushed after every change so per-row UI
    // updates live. convertBatch owns the sequential run loop (tested).
    let rows: BatchItem[] = batch.map((b) => ({ ...b, status: "pending", progress: 0 }));
    setBatch(rows);
    const startedAt: number[] = [];
    await convertBatch(
      toolId,
      rows.map((r) => r.file),
      {
        onStart: (i) => {
          startedAt[i] = performance.now();
          rows = rows.map((r, idx) => (idx === i ? { ...r, status: "running" } : r));
          setBatch(rows);
        },
        onProgress: (i, p) => {
          rows = rows.map((r, idx) => (idx === i ? { ...r, progress: p } : r));
          setBatch(rows);
        },
        onSettled: (i, result) => {
          rows = rows.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: result.status,
                  progress: result.status === "success" ? 1 : r.progress,
                  output: result.output,
                  error: result.error,
                }
              : r,
          );
          setBatch(rows);
          if (result.status === "success") {
            posthog.capture("convert_success", {
              tool: toolId,
              size: sizeBucket(result.file.size),
              duration_ms: Math.round(performance.now() - (startedAt[i] ?? performance.now())),
              batch_size: rows.length,
            });
          } else {
            posthog.capture("convert_error", {
              tool: toolId,
              size: sizeBucket(result.file.size),
              error_class: result.errorClass ?? "Unknown",
              batch_size: rows.length,
            });
          }
        },
      },
    );
    setPhase("done");
  }, [batch, toolId]);

  const downloadBatch = useCallback(async () => {
    if (!batch) return;
    const ok = batch.filter((b) => b.status === "success" && b.output);
    if (ok.length === 0) return;
    posthog.capture("download_clicked", {
      tool: toolId,
      batch_size: batch.length,
    });
    const blob = await packageBatchZip(
      ok.map((b) => ({ file: b.file, status: "success" as const, output: b.output })),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}-converted.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [batch, toolId]);

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setOutput(null);
    setBatch(null);
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
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />

      <div className="px-6 py-10 sm:py-12 text-center">
        {phase === "idle" && <IdleState onPick={() => inputRef.current?.click()} accept={accept} />}

        {/* Single-file path: unchanged. Only renders when exactly one file
            was picked (batch is null), so its UI is byte-identical to before. */}
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

        {/* Batch path: 2+ files. Compact per-file list, sequential convert,
            one zip download. Mutually exclusive with the single-file path. */}
        {phase === "ready" && batch && (
          <BatchReadyState
            batch={batch}
            toolLabel={toolLabel}
            onConvert={startBatch}
            onCancel={reset}
          />
        )}
        {phase === "running" && batch && <BatchListState batch={batch} />}
        {phase === "done" && batch && (
          <BatchDoneState batch={batch} onDownload={downloadBatch} onReset={reset} />
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

// ===== Batch sub-components =====

function BatchFileRow({ item }: { item: BatchItem }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)]/60">
      <span className="shrink-0">
        {item.status === "success" ? (
          <span className="inline-flex w-5 h-5 rounded-full bg-[var(--color-pink-100)] items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#E0297B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : item.status === "error" ? (
          <span className="inline-flex w-5 h-5 rounded-full bg-red-50 items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        ) : item.status === "running" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin">
            <path d="M21 12a9 9 0 11-6.219-8.56" stroke="#E0297B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <span className="inline-flex w-5 h-5 text-[var(--color-text-3)]">
            <FileIcon />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm text-[var(--color-text)]">{item.file.name}</span>
        {item.status === "error" ? (
          <span className="block truncate text-xs text-red-600">{item.error}</span>
        ) : (
          <span className="block text-xs text-[var(--color-text-3)]">
            {item.status === "running"
              ? `Converting… ${Math.round(item.progress * 100)}%`
              : item.status === "success"
                ? "Done"
                : formatBytes(item.file.size)}
          </span>
        )}
      </span>
    </div>
  );
}

function BatchScroll({ batch }: { batch: BatchItem[] }) {
  return (
    <div className="w-full max-w-md mt-1 max-h-64 overflow-y-auto flex flex-col gap-1.5 text-left">
      {batch.map((item, i) => (
        <BatchFileRow key={`${item.file.name}-${i}`} item={item} />
      ))}
    </div>
  );
}

function BatchReadyState({
  batch,
  toolLabel,
  onConvert,
  onCancel,
}: {
  batch: BatchItem[];
  toolLabel: string;
  onConvert: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <FileIconLarge />
      <div>
        <p className="font-medium text-[var(--color-text)]">{batch.length} files selected</p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          ready to convert as {toolLabel}
        </p>
      </div>
      <BatchScroll batch={batch} />
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onConvert}
          className="bg-[var(--color-pink-600)] text-white font-medium px-6 py-3 rounded-lg shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-700)] transition-colors"
        >
          Convert {batch.length} files
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors px-4 py-3"
        >
          Pick different files
        </button>
      </div>
    </div>
  );
}

function BatchListState({ batch }: { batch: BatchItem[] }) {
  const done = batch.filter((b) => b.status === "success" || b.status === "error").length;
  return (
    <div className="flex flex-col items-center gap-4">
      <SpinnerIcon />
      <div>
        <p className="font-medium text-[var(--color-text)]">
          Converting {done} / {batch.length}
        </p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          Running in your browser. Nothing leaves your device.
        </p>
      </div>
      <BatchScroll batch={batch} />
    </div>
  );
}

function BatchDoneState({
  batch,
  onDownload,
  onReset,
}: {
  batch: BatchItem[];
  onDownload: () => void;
  onReset: () => void;
}) {
  const ok = batch.filter((b) => b.status === "success").length;
  const failed = batch.length - ok;
  return (
    <div className="flex flex-col items-center gap-4">
      {ok > 0 ? <CheckIcon /> : <ErrorIcon />}
      <div>
        <p className="font-medium text-[var(--color-text)]">
          {ok} of {batch.length} converted
          {failed > 0 ? ` · ${failed} failed` : ""}
        </p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          {ok > 0
            ? "Download all converted files as a zip."
            : "No files could be converted."}
        </p>
      </div>
      <BatchScroll batch={batch} />
      <div className="flex items-center gap-3 mt-2">
        {ok > 0 && (
          <button
            onClick={onDownload}
            className="bg-[var(--color-pink-600)] text-white font-medium px-6 py-3 rounded-lg shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-700)] transition-colors inline-flex items-center gap-2"
          >
            <DownloadIcon />
            Download all ({ok}) as .zip
          </button>
        )}
        <button
          onClick={onReset}
          className="text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)] transition-colors px-4 py-3"
        >
          Convert more
        </button>
      </div>
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
