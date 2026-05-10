/**
 * Streaming SAX parser for Apple Health's `export.xml`.
 *
 * Apple Health exports look like this (after unzipping `export.zip`):
 *
 *   <?xml version="1.0" encoding="UTF-8"?>
 *   <!DOCTYPE HealthData ...>
 *   <HealthData locale="en_US">
 *     <ExportDate value="2025-01-01 12:00:00 -0500"/>
 *     <Me HKCharacteristicTypeIdentifierDateOfBirth="..." />
 *     <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone"
 *             unit="count" creationDate="2024-12-31 23:59:00 -0500"
 *             startDate="2024-12-31 23:58:00 -0500" endDate="2024-12-31 23:59:00 -0500"
 *             value="142"/>
 *     ... potentially MILLIONS of records ...
 *   </HealthData>
 *
 * Why streaming SAX (not DOMParser):
 *   Real exports can hit 500MB+ — building a full DOM tree OOMs the tab.
 *   SAX walks the file as a stream of events, letting us push records into
 *   typed buckets and discard the raw nodes immediately. We also accept the
 *   raw `export.zip` directly and find the inner XML via JSZip — most users
 *   download what Apple gives them and don't realize there's an unzip step.
 */

import type JSZipType from "jszip";

export interface AppleHealthRecord {
  /** Strip the HK prefix (e.g. "StepCount", "HeartRate", "ActiveEnergyBurned") */
  type: string;
  /** Original full type id, useful for round-trip. */
  fullType: string;
  /** ISO 8601 datetime (we keep timezone offset from the source). */
  startDate: string;
  endDate: string;
  /** Numeric value when present; some records (workouts) have no value. */
  value?: number;
  /** Unit as reported by Apple ("count", "bpm", "kcal", "min", "km", etc.). */
  unit?: string;
  /** Source app name ("Apple Watch", "iPhone", "Strava", etc.). */
  sourceName?: string;
}

export interface AppleHealthWorkout {
  activityType: string; // strip the HKWorkoutActivityType prefix
  startDate: string;
  endDate: string;
  durationMinutes?: number;
  totalDistance?: number;
  distanceUnit?: string;
  totalEnergyBurned?: number;
  energyUnit?: string;
  sourceName?: string;
}

export interface AppleHealthExport {
  records: AppleHealthRecord[];
  workouts: AppleHealthWorkout[];
}

const HK_TYPE_PREFIX = "HKQuantityTypeIdentifier";
const HK_CATEGORY_PREFIX = "HKCategoryTypeIdentifier";
const HK_WORKOUT_PREFIX = "HKWorkoutActivityType";

function stripHkPrefix(s: string): string {
  if (s.startsWith(HK_TYPE_PREFIX)) return s.slice(HK_TYPE_PREFIX.length);
  if (s.startsWith(HK_CATEGORY_PREFIX)) return s.slice(HK_CATEGORY_PREFIX.length);
  return s;
}

/**
 * If the input is a zip, locate `export.xml` inside it (possibly nested in
 * `apple_health_export/`) and return its contents as a string. If it's
 * already XML, return as-is.
 */
async function readExportXml(input: File | Blob): Promise<string> {
  const bytes = new Uint8Array(await input.arrayBuffer());
  // ZIP magic number: 0x50 0x4B 0x03 0x04
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!isZip) {
    return new TextDecoder("utf-8").decode(bytes);
  }
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(bytes);
  // Apple's structure: apple_health_export/export.xml. Some users pre-extract.
  const entry =
    zip.file("apple_health_export/export.xml") ??
    zip.file("export.xml") ??
    zip.file(/export\.xml$/i)[0];
  if (!entry) throw new Error("export.xml not found inside the zip");
  return entry.async("string");
}

export interface ParseOptions {
  /** Filter records by type id. e.g. ["StepCount"] keeps only step count records. */
  recordTypes?: string[];
  /** If false, skip parsing workouts (memory + speed win for record-only exports). */
  includeWorkouts?: boolean;
  /** 0..1 progress callback fired periodically by byte position. */
  onProgress?: (fraction: number) => void;
}

export async function parseAppleHealth(
  input: File | Blob,
  opts: ParseOptions = {},
): Promise<AppleHealthExport> {
  const xml = await readExportXml(input);
  const totalLength = xml.length;
  const sax = await import("sax");

  const records: AppleHealthRecord[] = [];
  const workouts: AppleHealthWorkout[] = [];
  const wantTypes = opts.recordTypes ? new Set(opts.recordTypes) : null;
  const includeWorkouts = opts.includeWorkouts !== false;

  // strict=false = HTML-style forgiving mode (Apple's XML is well-formed but
  // strict mode is slower and stricter than we need).
  const parser = sax.parser(false, { lowercase: false, trim: true });
  let lastProgressFire = 0;

  parser.onopentag = (node) => {
    const name = node.name;
    const attrs = node.attributes as Record<string, string>;
    if (name === "Record") {
      const fullType = attrs.type;
      if (!fullType) return;
      const typeId = stripHkPrefix(fullType);
      if (wantTypes && !wantTypes.has(typeId)) return;
      const valueRaw = attrs.value;
      records.push({
        type: typeId,
        fullType,
        startDate: attrs.startDate,
        endDate: attrs.endDate,
        value: valueRaw ? parseFloat(valueRaw) : undefined,
        unit: attrs.unit,
        sourceName: attrs.sourceName,
      });
    } else if (name === "Workout" && includeWorkouts) {
      const fullType = attrs.workoutActivityType ?? "";
      const activityType = fullType.startsWith(HK_WORKOUT_PREFIX)
        ? fullType.slice(HK_WORKOUT_PREFIX.length)
        : fullType;
      workouts.push({
        activityType,
        startDate: attrs.startDate,
        endDate: attrs.endDate,
        durationMinutes: attrs.duration ? parseFloat(attrs.duration) : undefined,
        totalDistance: attrs.totalDistance ? parseFloat(attrs.totalDistance) : undefined,
        distanceUnit: attrs.totalDistanceUnit,
        totalEnergyBurned: attrs.totalEnergyBurned ? parseFloat(attrs.totalEnergyBurned) : undefined,
        energyUnit: attrs.totalEnergyBurnedUnit,
        sourceName: attrs.sourceName,
      });
    }
  };

  // Feed the parser in chunks so we can fire progress and avoid blocking the
  // event loop for too long on huge files.
  const CHUNK = 256 * 1024; // 256KB
  for (let i = 0; i < totalLength; i += CHUNK) {
    parser.write(xml.slice(i, i + CHUNK));
    if (opts.onProgress) {
      const now = i + CHUNK;
      if (now - lastProgressFire > totalLength / 50) {
        opts.onProgress(Math.min(1, now / totalLength));
        lastProgressFire = now;
        // Yield to the event loop so the UI can repaint.
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }
  parser.close();

  return { records, workouts };
}
