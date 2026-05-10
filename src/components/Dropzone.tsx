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
import { run } from "@/lib/engine/runner";

type Phase = "idle" | "ready" | "running" | "done" | "error";

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

  const onFiles = useCallback((files: FileList | File[]) => {
    const f = Array.from(files)[0];
    if (!f) return;
    setFile(f);
    setOutput(null);
    setError(null);
    setProgress(0);
    setPhase("ready");
  }, []);

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
    setPhase("running");
    setProgress(0);
    setError(null);
    try {
      const result = await run(toolId, file, { onProgress: setProgress });
      setOutput(result);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }, [file, toolId]);

  const downloadOutput = useCallback(() => {
    if (!output) return;
    const url = URL.createObjectURL(output.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = output.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [output]);

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setOutput(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? "dropzone-active"
          : "border-[var(--color-border-2)] bg-[var(--color-surface)] hover:border-[var(--color-pink-400)] hover:bg-[var(--color-pink-50)]"
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

      <div className="px-6 py-12 sm:py-16 text-center">
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
  );
}

// ===== State sub-components =====

function IdleState({ onPick, accept }: { onPick: () => void; accept: string[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <CloudIcon />
      <div>
        <p className="text-lg font-semibold text-[var(--color-text)]">
          Select your file here to get started
        </p>
        <p className="text-sm text-[var(--color-text-3)] mt-1">
          or drop your file here.
        </p>
      </div>
      <button
        onClick={onPick}
        className="mt-2 inline-flex items-center gap-2 bg-[var(--color-pink-600)] text-white font-medium px-6 py-3 rounded-lg shadow-[var(--shadow-pink)] hover:bg-[var(--color-pink-700)] transition-colors"
      >
        <FileIcon />
        Select File
      </button>
      <p className="text-xs text-[var(--color-text-3)] mt-3">
        Accepts: {accept.join(", ")}
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
    <div className="w-14 h-14 rounded-full bg-[var(--color-pink-100)] flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M16 16l-4-4-4 4M12 12v9"
          stroke="#E0297B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"
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
