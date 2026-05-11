import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { bytesToBase64 } from "../util/encoding";

/**
 * DER → PEM. Wraps the raw ASN.1 DER bytes in base64 + the standard
 * `-----BEGIN CERTIFICATE-----` / `-----END CERTIFICATE-----` armor.
 * Defaults the label to CERTIFICATE because that's the 95% case; users
 * needing other PEM types (PRIVATE KEY, PUBLIC KEY, CERTIFICATE REQUEST)
 * can rename the header by hand after — the body bytes are the same.
 *
 * PEM line-wrapping is 64 columns per RFC 7468.
 */
const derToPem: Converter = {
  id: "der-to-pem",
  label: "DER → PEM",
  fromMime: ["application/pkix-cert", "application/x-x509-ca-cert", "application/octet-stream"],
  accept: [".der", ".cer", ".crt"],
  toMime: "application/x-pem-file",
  maxFileSizeBytes: 5 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let pem: string;
    try {
      const bytes = new Uint8Array(await input.arrayBuffer());
      if (bytes.length === 0) throw new Error("DER input is empty");
      const b64 = bytesToBase64(bytes);
      // Wrap at 64 cols per RFC 7468
      const wrapped = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
      pem = `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`;
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert DER to PEM",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([pem], { type: "application/x-pem-file;charset=utf-8" }),
      filename: swapExtension(input.name, "pem"),
    };
  },
};

export default derToPem;
