import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * Twitter (X) archive → CSV. Uses the `twitter-archive-reader` package
 * which handles both the legacy "classic" archive shape and the GDPR
 * shape Twitter ships now (a zip with a `data/` subdirectory full of
 * `.js` files that wrap JSON).
 *
 * Output columns are the most-asked-for tweet fields. Threading info,
 * quote-tweets, and image URLs are dropped — users who want the full
 * relational shape should use the JSON output.
 */
const twitterArchiveToCsv: Converter = {
  id: "twitter-archive-to-csv",
  label: "Twitter Archive → CSV",
  fromMime: ["application/zip"],
  accept: [".zip"],
  toMime: "text/csv",
  maxFileSizeBytes: 1024 * 1024 * 1024, // 1 GB — old accounts' archives are huge

  async convert(input, opts) {
    opts?.onProgress?.(0.05);
    let csv: string;
    try {
      const { default: TwitterArchive } = await import("twitter-archive-reader");
      const archive = new TwitterArchive(input);
      await archive.ready();
      opts?.onProgress?.(0.7);

      const tweets = archive.tweets.all;
      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        tweets.map((t) => ({
          id: t.id_str,
          createdAt: t.created_at,
          text: t.full_text ?? t.text ?? "",
          retweetCount: (t as { retweet_count?: number }).retweet_count ?? "",
          favoriteCount: (t as { favorite_count?: number }).favorite_count ?? "",
          inReplyToScreenName: t.in_reply_to_screen_name ?? "",
          inReplyToStatusId: t.in_reply_to_status_id_str ?? "",
          isRetweet: t.retweeted ? "true" : "false",
          source: (t.source ?? "").replace(/<[^>]+>/g, ""),
        })),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not read Twitter archive",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename: swapExtension(input.name, "csv"),
    };
  },
};

export default twitterArchiveToCsv;
