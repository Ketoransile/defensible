import { THRESHOLDS } from "@/config/thresholds";
import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function priorityAreasCount(app: Application): Finding[] {
  const n = app.expectedResults.length;
  if (n === THRESHOLDS.requiredPriorityAreas) return [];
  return [
    makeFinding(
      "PRIORITY_AREAS_COUNT",
      "defect",
      "Section 2.4 requires exactly three priority areas",
      `expectedResults has ${n} ${n === 1 ? "area" : "areas"}; the scheme asks for three.`,
      ["expectedResults"],
      { count: n, required: THRESHOLDS.requiredPriorityAreas },
    ),
  ];
}
