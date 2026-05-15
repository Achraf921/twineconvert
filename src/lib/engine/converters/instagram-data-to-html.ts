import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { findInstagramPosts, fixMetaEncoding, loadJsonArrays } from "../util/meta-archive";

interface InstaPost {
  media?: Array<{ uri?: string; creation_timestamp?: number; title?: string }>;
  creation_timestamp?: number;
  title?: string;
}

const instagramDataToHtml: Converter = {
  id: "instagram-data-to-html",
  label: "Instagram Data → HTML",
  fromMime: ["application/zip"],
  accept: [".zip"],
  toMime: "text/html",
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let html: string;
    try {
      const files = await findInstagramPosts(input);
      opts?.onProgress?.(0.5);
      const posts = await loadJsonArrays<InstaPost>(files);

      const cards = posts
        .sort((a, b) => (b.creation_timestamp ?? 0) - (a.creation_timestamp ?? 0))
        .map((p) => {
          const date = p.creation_timestamp
            ? new Date(p.creation_timestamp * 1000).toISOString().slice(0, 10)
            : "";
          const caption = escapeHtml(fixMetaEncoding(p.title ?? p.media?.[0]?.title ?? ""));
          const mediaCount = p.media?.length ?? 0;
          return `<article class="post"><div class="date">${date}</div><div class="caption">${caption || "<em>(no caption)</em>"}</div><div class="meta">${mediaCount} media item${mediaCount === 1 ? "" : "s"}</div></article>`;
        })
        .join("\n");

      html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Instagram Posts Archive</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: #fafafa; }
  h1 { border-bottom: 1px solid #dbdbdb; padding-bottom: 0.5rem; }
  .post { background: #fff; border: 1px solid #dbdbdb; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
  .date { color: #8e8e8e; font-size: 0.85rem; margin-bottom: 6px; }
  .caption { color: #262626; line-height: 1.45; white-space: pre-wrap; }
  .meta { color: #8e8e8e; font-size: 0.8rem; margin-top: 8px; }
</style>
</head>
<body>
<h1>Instagram Posts (${posts.length})</h1>
${cards}
</body>
</html>`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not read Instagram archive",
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

export default instagramDataToHtml;
