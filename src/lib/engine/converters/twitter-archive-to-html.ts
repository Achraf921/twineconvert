import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Twitter (X) archive → HTML. Self-contained tweet-list page styled
 * loosely like a Twitter timeline. Useful for users who quit the
 * platform but want to keep a browsable record of what they posted.
 */
const twitterArchiveToHtml: Converter = {
  id: "twitter-archive-to-html",
  label: "Twitter Archive → HTML",
  fromMime: ["application/zip"],
  accept: [".zip"],
  toMime: "text/html",
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let html: string;
    try {
      const { default: TwitterArchive } = await import("twitter-archive-reader");
      const archive = new TwitterArchive(input);
      await archive.ready();
      opts?.onProgress?.(0.7);

      const tweets = archive.tweets.all;
      const screenName = archive.user.screen_name;
      const totalTweets = tweets.length;

      const tweetsHtml = tweets
        .slice() // shallow copy so the sort doesn't mutate the source
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .map((t) => {
          const text = (t.full_text ?? t.text ?? "")
            .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!))
            .replace(/\n/g, "<br>");
          const date = new Date(t.created_at).toISOString();
          const replyCtx = t.in_reply_to_screen_name
            ? `<div class="reply">↳ replying to @${t.in_reply_to_screen_name}</div>`
            : "";
          return `<article class="tweet"><div class="meta">${date}</div>${replyCtx}<div class="text">${text}</div></article>`;
        })
        .join("\n");

      html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Twitter Archive, @${screenName}</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: #f7f9fa; }
  h1 { border-bottom: 1px solid #ccd; padding-bottom: 0.5rem; }
  .tweet { background: #fff; border: 1px solid #cfd9de; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }
  .meta { color: #536471; font-size: 0.85rem; margin-bottom: 4px; }
  .reply { color: #536471; font-size: 0.85rem; margin-bottom: 4px; }
  .text { color: #0f1419; line-height: 1.4; }
</style>
</head>
<body>
<h1>@${screenName}, ${totalTweets} tweets</h1>
${tweetsHtml}
</body>
</html>`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not read Twitter archive",
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

export default twitterArchiveToHtml;
