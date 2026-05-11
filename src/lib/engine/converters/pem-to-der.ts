import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { base64ToBytes } from "../util/encoding";

/**
 * PEM → DER. PEM (Privacy-Enhanced Mail) wraps DER (Distinguished Encoding
 * Rules) bytes in base64 with `-----BEGIN ...-----` / `-----END ...-----`
 * delimiters. DER is the raw binary form. Converting strips the armor and
 * gives you the underlying ASN.1 binary, which is what most low-level
 * crypto tools (`openssl x509 -inform der`, Java keytool, Windows certmgr)
 * expect for direct cert/key inspection.
 *
 * Works for any single-block PEM: certificates, private keys, public keys,
 * CSRs, encrypted keys (output is the encrypted DER bytes — still need
 * the password to decrypt).
 */
const pemToDer: Converter = {
  id: "pem-to-der",
  label: "PEM → DER",
  fromMime: ["application/x-pem-file", "text/plain"],
  accept: [".pem", ".crt", ".cer", ".key"],
  toMime: "application/pkix-cert",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let bytes: Uint8Array;
    try {
      const text = await input.text();
      // Match the first PEM block: anything between BEGIN and END headers.
      const match = text.match(/-----BEGIN [^-]+-----([\s\S]+?)-----END [^-]+-----/);
      if (!match) {
        throw new Error("No PEM block found (expected -----BEGIN ...----- / -----END ...-----)");
      }
      const b64 = match[1].replace(/\s+/g, "");
      bytes = base64ToBytes(b64);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert PEM to DER",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([bytes.buffer as ArrayBuffer], { type: "application/pkix-cert" }),
      filename: swapExtension(input.name, "der"),
    };
  },
};

export default pemToDer;
