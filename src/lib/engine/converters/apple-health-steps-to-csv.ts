import type { Converter } from "../types";
import { buildMetricCsv } from "../util/apple-health-csv-helper";

const appleHealthStepsToCsv: Converter = {
  id: "apple-health-steps-to-csv",
  label: "Apple Health Steps → CSV",
  fromMime: ["application/zip", "text/xml", "application/xml"],
  toMime: "text/csv",
  accept: [".zip", ".xml"],
  maxFileSizeBytes: 500 * 1024 * 1024,

  convert: (input, opts) =>
    buildMetricCsv(
      input,
      ["StepCount", "DistanceWalkingRunning", "FlightsClimbed"],
      "steps",
      opts,
    ),
};

export default appleHealthStepsToCsv;
