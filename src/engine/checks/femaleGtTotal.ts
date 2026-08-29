import type { Application, Finding } from "@/types";
import { HISTORICAL_YEARS, makeFinding } from "./helpers";

export function femaleGtTotal(app: Application): Finding[] {
  const findings: Finding[] = [];
  for (const year of HISTORICAL_YEARS) {
    const { femaleEmployees, totalEmployees } = app.growth[year];
    if (femaleEmployees == null || totalEmployees == null) continue;
    if (femaleEmployees > totalEmployees) {
      findings.push(
        makeFinding(
          "FEMALE_GT_TOTAL",
          "contradiction",
          `Female staff exceed total staff in ${year}`,
          `${femaleEmployees} female employees is greater than ${totalEmployees} total employees (${year}).`,
          [`growth.${year}.femaleEmployees`, `growth.${year}.totalEmployees`],
          { year, femaleEmployees, totalEmployees },
        ),
      );
    }
  }
  return findings;
}
