/**
 * Sanitize untrusted HTML before embedding it in our output documents.
 *
 * Threat: an email-to-html / chat-to-html / archive-to-html converter
 * receives user-uploaded content that may include hostile HTML
 * (`<script>`, `<iframe>`, `onerror=`, `javascript:` URLs, etc.).
 * The user then opens the converted HTML in their browser, which
 * happily executes any script that survives the conversion. That's a
 * stored XSS that bypasses the user's webmail client's own sanitizer.
 *
 * DOMPurify is a battle-tested HTML sanitizer with a default
 * profile that strips scripts, on-* event handlers, javascript:
 * URLs, base/meta/object/embed/link tags, and other XSS surfaces.
 * We apply it to every HTML body before it leaves the engine.
 */

let purifyPromise: Promise<{ sanitize: (s: string) => string }> | null = null;

async function getPurify() {
  if (!purifyPromise) {
    purifyPromise = (async () => {
      const mod = await import("dompurify");
      const factory = (mod.default ?? mod) as unknown as
        | ((window?: Window) => { sanitize: (s: string) => string })
        | { sanitize: (s: string) => string };
      // dompurify exports either a factory (in Node, where it needs jsdom)
      // or a ready instance (in the browser, where it uses globalThis).
      if (typeof factory === "function") {
        const instance = factory(typeof window !== "undefined" ? window : undefined);
        return instance;
      }
      return factory;
    })();
  }
  return purifyPromise;
}

/** Strip every script, event handler, javascript: URL, and other
 *  XSS-prone construct from the input HTML, returning a string safe
 *  to embed in our output documents. */
export async function sanitizeHtml(html: string): Promise<string> {
  if (!html) return "";
  const dp = await getPurify();
  return dp.sanitize(html);
}
