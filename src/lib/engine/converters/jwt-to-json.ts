import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";

/**
 * JWT → JSON. JSON Web Tokens are three base64url-encoded JSON segments
 * separated by dots: `<header>.<payload>.<signature>`. Decoding shows the
 * header (algorithm, type) + the payload (claims) as readable JSON. Does
 * NOT verify the signature — that requires the secret/public key, which
 * isn't a converter concern. This is a quick "what's actually inside this
 * token" inspection tool.
 */
const jwtToJson: Converter = {
  id: "jwt-to-json",
  label: "JWT → JSON",
  fromMime: ["text/plain", "application/jwt"],
  accept: [".jwt", ".txt"],
  toMime: "application/json",
  maxFileSizeBytes: 1 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let out: string;
    try {
      const text = (await input.text()).trim();
      // Strip "Bearer " prefix if user pasted an Authorization header value
      const token = text.replace(/^Bearer\s+/i, "");
      const parts = token.split(".");
      if (parts.length < 2 || parts.length > 3) {
        throw new Error(`JWT must have 2 or 3 dot-separated parts; got ${parts.length}`);
      }
      const decode = (b64url: string): unknown => {
        // base64url uses -/_ instead of +/, no padding
        const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), "=");
        try {
          return JSON.parse(atob(b64));
        } catch (e) {
          throw new Error(
            `JWT segment doesn't decode to JSON: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      };
      const result = {
        header: decode(parts[0]),
        payload: decode(parts[1]),
        signature: parts[2] ?? null,
      };
      out = JSON.stringify(result, null, 2) + "\n";
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not decode JWT to JSON",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([out], { type: "application/json;charset=utf-8" }),
      filename: swapExtension(input.name, "json"),
    };
  },
};

export default jwtToJson;
