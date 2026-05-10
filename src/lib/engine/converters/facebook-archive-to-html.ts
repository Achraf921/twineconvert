import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { findFilesInZip, fixMetaEncoding, loadJsonArrays } from "../util/meta-archive";

interface FbPost {
  timestamp?: number;
  data?: Array<{ post?: string }>;
  attachments?: Array<{ data?: Array<{ media?: { uri?: string; description?: string } }> }>;
  title?: string;
}

const POST_FILE_PATTERNS = [
  /your_facebook_activity\/posts\/your_posts__check_ins__photos_and_videos_\d+\.json$/i,
  /posts\/your_posts_\d+\.json$/i,
  /^posts\/your_posts\.json$/i,
  /your_posts__check_ins__photos_and_videos_\d+\.json$/i,
];

/**
 * Facebook archive → HTML. Same shape as the Instagram and Twitter
 * routes — finds the user's posts file(s) inside the zip, renders a
 * scrollable HTML timeline. Comments, friend lists, ad interactions
 * are out of scope for v1.
 */
const facebookArchiveToHtml: Converter = {
  id: "facebook-archive-to-html",
  label: "Facebook Archive → HTML",
  fromMime: ["application/zip"],
  accept: [".zip"],
  toMime: "text/html",
  maxFileSizeBytes: 2 * 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const { files } = await findFilesInZip(input, POST_FILE_PATTERNS);
      if (files.length === 0) {
        throw new Error("No post files found in the Facebook archive (expected posts/your_posts*.json)");
      }
      opts?.onProgress?.(0.5);
      const posts = await loadJsonArrays<FbPost>(files);

      const cards = posts
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .map((p) => {
          const date = p.timestamp ? new Date(p.timestamp * 1000).toISOString().slice(0, 16).replace("T", " ") : "";
          const text = fixMetaEncoding(
            p.data?.find((d) => d.post)?.post ?? p.title ?? "",
          );
          const attachmentCount = p.attachments?.[0]?.data?.length ?? 0;
          return `<article class="post"><div class="date">${date}</div><div class="text">${escapeHtml(text) || "<em>(no text)</em>"}</div>${attachmentCount ? `<div class="meta">${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}</div>` : ""}</article>`;
        })
        .join("\n");

      html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Facebook Posts Archive</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; background: #f0f2f5; }
  h1 { border-bottom: 1px solid #ccd0d5; padding-bottom: 0.5rem; }
  .post { background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
  .date { color: #65676b; font-size: 0.85rem; margin-bottom: 6px; }
  .text { color: #050505; line-height: 1.4; white-space: pre-wrap; }
  .meta { color: #65676b; font-size: 0.8rem; margin-top: 8px; }
</style>
</head>
<body>
<h1>Facebook Posts (${posts.length})</h1>
${cards}
</body>
</html>`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not read Facebook archive",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([html], { type: "text/html;charset=utf-8" }),
      filename: swapExtension(input.name, "html"),
    };
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export default facebookArchiveToHtml;
