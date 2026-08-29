import type { Application, Finding } from "@/types";
import { HISTORICAL_YEARS, makeFinding } from "./helpers";

export function youthGtTotal(app: Application): Finding[] {
  const findings: Finding[] = [];
  for (const year of HISTORICAL_YEARS) {
    const { youthEmployees, totalEmployees } = app.growth[year];
    if (youthEmployees == null || totalEmployees == null) continue;
    if (youthEmployees > totalEmployees) {
      findings.push(
        makeFinding(
          "YOUTH_GT_TOTAL",
          "contradiction",
          `Youth staff exceed total staff in ${year}`,
          `${youthEmployees} youth employees is greater than ${totalEmployees} total employees (${year}).`,
          [`growth.${year}.youthEmployees`, `growth.${year}.totalEmployees`],
          { year, youthEmployees, totalEmployees },
        ),
      );
    }
  }
  return findings;
}
