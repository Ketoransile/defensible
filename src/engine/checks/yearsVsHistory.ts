import { THRESHOLDS } from "@/config/thresholds";
import type { Application, Finding } from "@/types";
import { HISTORICAL_YEARS, makeFinding, rowHasFigures } from "./helpers";

export function yearsVsHistory(app: Application): Finding[] {
  const years = app.yearsInOperation;
  if (years == null) return [];
  const earliest = THRESHOLDS.applicationYear - years;
  const findings: Finding[] = [];

  for (const key of HISTORICAL_YEARS) {
    if (Number(key) >= earliest) continue;
    if (!rowHasFigures(app, key)) continue;
    findings.push(
      makeFinding(
        "YEARS_VS_HISTORY",
        "contradiction",
        "Trading history predates stated years in operation",
        `${years} years in operation (as of ${THRESHOLDS.applicationYear}) allows history from ${earliest} onward, but ${key} still has sales or staff figures.`,
        ["yearsInOperation", `growth.${key}.salesEtb`, `growth.${key}.totalEmployees`],
        {
          yearsInOperation: years,
          earliestAllowedYear: earliest,
          reportedYear: key,
          growth: app.growth[key],
        },
      ),
    );
  }
  return findings;
}
