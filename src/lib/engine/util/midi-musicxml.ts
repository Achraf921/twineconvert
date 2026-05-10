/**
 * MIDI ↔ MusicXML — minimal but functional.
 *
 * MIDI is the lowest-common-denominator of musical notation: it captures
 * note-on/note-off times and pitches, but not staff layout, key signatures
 * (well, partially), time signatures (yes), beam directions, dynamics,
 * articulations, lyrics, etc. MusicXML carries all of that.
 *
 * Going MIDI → MusicXML is therefore a LOSSY UPGRADE: we synthesize a
 * notation document with bar lines, time signatures, and durations, but
 * we can't recover slurs/articulations that weren't in the MIDI file.
 *
 * Going MusicXML → MIDI is a LOSSY DOWNGRADE: we drop everything that
 * isn't a note (lyrics, dynamics-as-marks, articulations) but the
 * audible result is faithful.
 *
 * v1 limitations (acceptable for the "I just need this to load in
 * MuseScore" use case which is the bulk of the demand):
 *   - Single track per part — multi-track polyphony is collapsed
 *   - Quarter-note quantization — sub-quarter durations are rounded
 *   - Time signature defaults to 4/4 unless the MIDI file declares it
 *   - Key signature defaults to C major
 */

import type { MidiData, MidiEvent, MidiNoteOnEvent, MidiTimeSignatureEvent } from "midi-file";

interface NoteEvent {
  pitch: number; // MIDI 0-127
  startTick: number;
  durationTicks: number;
  velocity: number;
  channel: number;
  trackIdx: number;
}

// ---- MIDI → MusicXML --------------------------------------------------

export async function midiToMusicXml(buf: ArrayBuffer): Promise<string> {
  const midiLib = await import("midi-file");
  const midi = midiLib.parseMidi(new Uint8Array(buf));
  const ppq = midi.header.ticksPerBeat ?? 480;

  // Walk events, materializing note pairs
  const notes: NoteEvent[] = [];
  let timeSigNum = 4;
  let timeSigDen = 4;

  midi.tracks.forEach((track, trackIdx) => {
    let cursor = 0;
    const open: Map<string, { tick: number; velocity: number; channel: number }> = new Map();
    for (const ev of track) {
      cursor += ev.deltaTime;
      if (ev.type === "noteOn" && (ev as MidiNoteOnEvent).velocity > 0) {
        const noteEv = ev as MidiNoteOnEvent;
        open.set(`${noteEv.channel}-${noteEv.noteNumber}`, {
          tick: cursor,
          velocity: noteEv.velocity,
          channel: noteEv.channel,
        });
      } else if (ev.type === "noteOff" || (ev.type === "noteOn" && (ev as MidiNoteOnEvent).velocity === 0)) {
        const off = ev as MidiNoteOnEvent;
        const key = `${off.channel}-${off.noteNumber}`;
        const start = open.get(key);
        if (start) {
          notes.push({
            pitch: off.noteNumber,
            startTick: start.tick,
            durationTicks: cursor - start.tick,
            velocity: start.velocity,
            channel: start.channel,
            trackIdx,
          });
          open.delete(key);
        }
      } else if (ev.type === "timeSignature") {
        const ts = ev as MidiTimeSignatureEvent;
        timeSigNum = ts.numerator;
        timeSigDen = ts.denominator;
      }
    }
  });

  notes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  return buildMusicXml(notes, ppq, timeSigNum, timeSigDen);
}

const PITCH_TO_NOTE = ["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"];
const PITCH_TO_ALTER = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

function midiPitchToNote(pitch: number): { step: string; alter: number; octave: number } {
  const octave = Math.floor(pitch / 12) - 1;
  const i = pitch % 12;
  return { step: PITCH_TO_NOTE[i], alter: PITCH_TO_ALTER[i], octave };
}

/**
 * Map a duration-in-ticks to a MusicXML <type> name (whole, half, quarter, eighth...).
 * We round to the nearest power-of-two division of the quarter; sub-quantum
 * durations round up to a sixteenth (smallest we emit).
 */
function ticksToTypeName(ticks: number, ppq: number): { type: string; durQuarters: number } {
  const ratio = ticks / ppq;
  if (ratio >= 4) return { type: "whole", durQuarters: 4 };
  if (ratio >= 2) return { type: "half", durQuarters: 2 };
  if (ratio >= 1) return { type: "quarter", durQuarters: 1 };
  if (ratio >= 0.5) return { type: "eighth", durQuarters: 0.5 };
  return { type: "16th", durQuarters: 0.25 };
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildMusicXml(notes: NoteEvent[], ppq: number, timeSigNum: number, timeSigDen: number): string {
  // Group notes into measures based on time signature.
  const ticksPerMeasure = ppq * timeSigNum * (4 / timeSigDen);
  const measureMap = new Map<number, NoteEvent[]>();
  for (const n of notes) {
    const measureIdx = Math.floor(n.startTick / ticksPerMeasure);
    const list = measureMap.get(measureIdx) ?? [];
    list.push(n);
    measureMap.set(measureIdx, list);
  }
  const measureCount = Math.max(1, Math.max(...measureMap.keys()) + 1);

  // Use divisions = 4 (so a quarter = 4 divisions, eighth = 2, etc.).
  const divisions = 4;
  const measuresXml: string[] = [];

  for (let m = 0; m < measureCount; m++) {
    const measureNotes = (measureMap.get(m) ?? []).sort((a, b) => a.startTick - b.startTick);
    const noteEls: string[] = [];

    if (m === 0) {
      noteEls.push(`<attributes>
        <divisions>${divisions}</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>${timeSigNum}</beats><beat-type>${timeSigDen}</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>`);
    }

    if (measureNotes.length === 0) {
      noteEls.push(`<note><rest/><duration>${divisions * timeSigNum * (4 / timeSigDen)}</duration><type>whole</type></note>`);
    } else {
      for (const n of measureNotes) {
        const pitch = midiPitchToNote(n.pitch);
        const { type, durQuarters } = ticksToTypeName(n.durationTicks, ppq);
        const duration = Math.max(1, Math.round(durQuarters * divisions));
        const alterEl = pitch.alter ? `<alter>${pitch.alter}</alter>` : "";
        noteEls.push(`<note>
          <pitch><step>${pitch.step}</step>${alterEl}<octave>${pitch.octave}</octave></pitch>
          <duration>${duration}</duration>
          <type>${type}</type>
        </note>`);
      }
    }
    measuresXml.push(`<measure number="${m + 1}">${noteEls.join("")}</measure>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${escapeXml("Converted from MIDI")}</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Music</part-name></score-part>
  </part-list>
  <part id="P1">
    ${measuresXml.join("\n    ")}
  </part>
</score-partwise>`;
}

// ---- MusicXML → MIDI --------------------------------------------------

export async function musicXmlToMidi(text: string): Promise<ArrayBuffer> {
  const midiLib = await import("midi-file");
  if (typeof DOMParser === "undefined") throw new Error("DOMParser unavailable");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parseError = doc.getElementsByTagName("parsererror")[0];
  if (parseError) throw new Error(`MusicXML parse failed: ${parseError.textContent?.slice(0, 120)}`);

  // We use a fixed PPQ of 480 (industry-standard) and read durations
  // proportionally to the score's <divisions>.
  const ppq = 480;
  const divisionsEl = doc.getElementsByTagName("divisions")[0];
  const divisions = parseInt(divisionsEl?.textContent ?? "1", 10);

  const noteEls = Array.from(doc.getElementsByTagName("note"));
  const events: MidiEvent[] = [];
  let lastEventTick = 0;
  let cursor = 0;

  const pushNoteOn = (tick: number, pitch: number, velocity: number) => {
    events.push({ type: "noteOn", channel: 0, noteNumber: pitch, velocity, deltaTime: tick - lastEventTick });
    lastEventTick = tick;
  };
  const pushNoteOff = (tick: number, pitch: number) => {
    events.push({ type: "noteOff", channel: 0, noteNumber: pitch, velocity: 0, deltaTime: tick - lastEventTick });
    lastEventTick = tick;
  };
  const pushEndOfTrack = (tick: number) => {
    events.push({ type: "endOfTrack", deltaTime: tick - lastEventTick });
    lastEventTick = tick;
  };

  for (const noteEl of noteEls) {
    const isRest = noteEl.getElementsByTagName("rest").length > 0;
    const durEl = noteEl.getElementsByTagName("duration")[0];
    const durDivisions = parseInt(durEl?.textContent ?? "0", 10);
    const durTicks = Math.round((durDivisions / divisions) * ppq);

    if (!isRest) {
      const pitchEl = noteEl.getElementsByTagName("pitch")[0];
      if (pitchEl) {
        const step = pitchEl.getElementsByTagName("step")[0]?.textContent ?? "C";
        const alter = parseInt(pitchEl.getElementsByTagName("alter")[0]?.textContent ?? "0", 10);
        const octave = parseInt(pitchEl.getElementsByTagName("octave")[0]?.textContent ?? "4", 10);
        const pitch = stepToMidi(step, alter, octave);
        pushNoteOn(cursor, pitch, 80);
        pushNoteOff(cursor + durTicks, pitch);
      }
    }
    cursor += durTicks;
  }
  pushEndOfTrack(cursor);

  const midi: MidiData = {
    header: { format: 1, numTracks: 1, ticksPerBeat: ppq },
    tracks: [events],
  };
  const u8 = midiLib.writeMidi(midi);
  // writeMidi returns number[] — convert to a clean ArrayBuffer.
  const arr = new Uint8Array(u8);
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

function stepToMidi(step: string, alter: number, octave: number): number {
  const baseMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return (octave + 1) * 12 + (baseMap[step] ?? 0) + alter;
}
