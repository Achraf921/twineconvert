import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { findInstagramPosts, fixMetaEncoding, loadJsonArrays } from "../util/meta-archive";

interface InstaPost {
  // Modern shape
  media?: Array<{ uri?: string; creation_timestamp?: number; title?: string; cross_post_source?: { source_app?: string } }>;
  creation_timestamp?: number;
  title?: string;
  // Legacy shape
  taken_at?: string;
  caption?: string;
}

/**
 * Instagram Data Export → CSV. Pulls the user's posts (the most-asked-for
 * subset of the archive). Stories, reels, comments, follower lists are
 * intentionally out of scope for v1, those can be separate routes later
 * if the post route gets traction.
 *
 * The export zip from Instagram ships posts as either one big JSON or
 * multiple paginated `posts_1.json`, `posts_2.json` files. We collect
 * all of them. Schema has shifted across Meta's export-format versions;
 * we handle both the modern `media[]` array and the legacy flat shape.
 * Post-file discovery + the actionable "wrong export / HTML format"
 * errors live in findInstagramPosts() so this and instagram-data-to-html
 * stay in sync.
 */
const instagramDataToCsv: Converter = {
  id: "instagram-data-to-csv",
  label: "Instagram Data → CSV",
  fromMime: ["application/zip"],
  accept: [".zip"],
  toMime: "text/csv",
  maxFileSizeBytes: 1024 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let csv: string;
    try {
      const files = await findInstagramPosts(input);
      opts?.onProgress?.(0.4);
      const posts = await loadJsonArrays<InstaPost>(files);

      const Papa = (await import("papaparse")).default;
      csv = Papa.unparse(
        posts.map((p) => {
          const ts = p.creation_timestamp ?? p.media?.[0]?.creation_timestamp ?? 0;
          const date = ts ? new Date(ts * 1000).toISOString() : (p.taken_at ?? "");
          const caption = fixMetaEncoding(p.title ?? p.caption ?? p.media?.[0]?.title ?? "");
          const mediaUris = (p.media ?? []).map((m) => m.uri).filter(Boolean).join("; ");
          const sourceApp = p.media?.[0]?.cross_post_source?.source_app ?? "";
          return {
            date,
            caption,
            mediaCount: p.media?.length ?? 0,
            mediaUris,
            crossPostSource: sourceApp,
          };
        }),
      );
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not read Instagram archive",
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

export default instagramDataToCsv;
