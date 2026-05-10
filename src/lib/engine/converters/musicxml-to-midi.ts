import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { musicXmlToMidi } from "../util/midi-musicxml";

const musicXmlToMidiConverter: Converter = {
  id: "musicxml-to-midi",
  label: "MusicXML → MIDI",
  fromMime: ["application/vnd.recordare.musicxml+xml", "application/xml", "text/xml"],
  accept: [".musicxml", ".xml"],
  toMime: "audio/midi",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let buf: ArrayBuffer;
    try {
      buf = await musicXmlToMidi(await input.text());
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert MusicXML to MIDI", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([buf], { type: "audio/midi" }),
      filename: swapExtension(input.name, "mid"),
    };
  },
};

export default musicXmlToMidiConverter;
