import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { midiToMusicXml } from "../util/midi-musicxml";

const midiToMusicXmlConverter: Converter = {
  id: "midi-to-musicxml",
  label: "MIDI → MusicXML",
  fromMime: ["audio/midi", "audio/x-midi"],
  accept: [".mid", ".midi"],
  toMime: "application/vnd.recordare.musicxml+xml",
  maxFileSizeBytes: 20 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let xml: string;
    try {
      xml = await midiToMusicXml(await input.arrayBuffer());
    } catch (err) {
      throw new ConvertFailedError(err instanceof Error ? err.message : "Could not convert MIDI to MusicXML", err);
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" }),
      filename: swapExtension(input.name, "musicxml"),
    };
  },
};

export default midiToMusicXmlConverter;
