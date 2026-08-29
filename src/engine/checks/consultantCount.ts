import { THRESHOLDS } from "@/config/thresholds";
import { isPresent } from "@/lib/fields";
import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function consultantCount(app: Application): Finding[] {
  const n = app.consultantRequests.filter(
    (row) =>
      isPresent(row.problemDescription) ||
      isPresent(row.technicalExpertiseRequest),
  ).length;
  if (n <= THRESHOLDS.maxConsultantRequests) return [];
  return [
    makeFinding(
      "CONSULTANT_COUNT",
      "defect",
      "More than three consultant requests",
      `${n} consultant requests were listed; the scheme funds technical support for three problems.`,
      ["consultantRequests"],
      { count: n, max: THRESHOLDS.maxConsultantRequests },
    ),
  ];
}
