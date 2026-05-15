/**
 * One-shot in-memory handoff for files dropped on the homepage.
 *
 * The homepage dropzone only routes (it picks the right /x-to-y tool from
 * the file's extension); the actual conversion runs on the tool page. File
 * objects can't ride along in a URL, but App Router client navigation keeps
 * the same JS context, so a module singleton survives the push. The tool
 * page consumes it once on mount, then it's cleared so a later plain visit
 * doesn't replay stale files.
 */

let pending: File[] | null = null;

export function setPendingFiles(files: File[]): void {
  pending = files.length > 0 ? files : null;
}

export function takePendingFiles(): File[] | null {
  const f = pending;
  pending = null;
  return f;
}
