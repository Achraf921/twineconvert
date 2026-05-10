import type { Converter } from "../types";
import { buildMetricCsv } from "../util/apple-health-csv-helper";

const appleHealthSleepToCsv: Converter = {
  id: "apple-health-sleep-to-csv",
  label: "Apple Health Sleep → CSV",
  fromMime: ["application/zip", "text/xml", "application/xml"],
  toMime: "text/csv",
  accept: [".zip", ".xml"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  convert: (input, opts) =>
    buildMetricCsv(
      input,
      ["SleepAnalysis"],
      "sleepStage",
      opts,
    ),
};

export default appleHealthSleepToCsv;
