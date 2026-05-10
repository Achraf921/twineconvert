import type { Converter } from "../types";
import { buildMetricCsv } from "../util/apple-health-csv-helper";

const appleHealthHeartRateToCsv: Converter = {
  id: "apple-health-heart-rate-to-csv",
  label: "Apple Health Heart Rate → CSV",
  fromMime: ["application/zip", "text/xml", "application/xml"],
  toMime: "text/csv",
  accept: [".zip", ".xml"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  convert: (input, opts) =>
    buildMetricCsv(
      input,
      ["HeartRate", "RestingHeartRate", "WalkingHeartRateAverage", "HeartRateVariabilitySDNN"],
      "bpm",
      opts,
    ),
};

export default appleHealthHeartRateToCsv;
