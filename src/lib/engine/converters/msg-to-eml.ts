import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { buildEml, parseMsg } from "../util/msg";

/**
 * MSG → EML. .msg is Outlook's proprietary OLE compound document for
 * a single message. EML is the standardised RFC 5322 format every
 * other mail client reads. This pulls the Outlook headers + body
 * into a clean EML, ideal for archiving or moving away from Outlook.
 *
 * Attachments inside the .msg are surfaced as an X-Original-Attachments
 * header listing their filenames. Full multipart MIME packaging of
 * binary attachments is out of scope for this route.
 */
const msgToEml: Converter = {
  id: "msg-to-eml",
  label: "MSG → EML",
  fromMime: ["application/vnd.ms-outlook", "application/x-msg", "application/octet-stream"],
  accept: [".msg"],
  toMime: "message/rfc822",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let eml: string;
    try {
      const msg = await parseMsg(await input.arrayBuffer());
      if (!msg.subject && !msg.from && !msg.body) {
        throw new Error(
          "MSG had no readable subject, sender, or body. The file may be a calendar item or task rather than an email, or it may use a property layout the parser does not recognise.",
        );
      }
      eml = buildEml(msg);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert MSG to EML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([eml], { type: "message/rfc822;charset=utf-8" }),
      filename: swapExtension(input.name, "eml"),
    };
  },
};

export default msgToEml;
