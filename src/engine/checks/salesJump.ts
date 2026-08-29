import { THRESHOLDS } from "@/config/thresholds";
import type { Application, Finding } from "@/types";
import { HISTORICAL_YEARS, makeFinding } from "./helpers";

export function salesJump(app: Application): Finding[] {
  const findings: Finding[] = [];
  for (let i = 1; i < HISTORICAL_YEARS.length; i++) {
    const prevKey = HISTORICAL_YEARS[i - 1];
    const nextKey = HISTORICAL_YEARS[i];
    const prev = app.growth[prevKey].salesEtb;
    const next = app.growth[nextKey].salesEtb;
    if (prev == null || next == null || prev <= 0) continue;
    const multiple = next / prev;
    if (multiple <= THRESHOLDS.salesJumpMultiple) continue;
    findings.push(
      makeFinding(
        "SALES_JUMP",
        "flag",
        `Sales jump ${prevKey}→${nextKey}`,
        `Sales moved from ${prev.toLocaleString("en-US")} to ${next.toLocaleString("en-US")} ETB (${multiple.toFixed(1)}×), above the ${THRESHOLDS.salesJumpMultiple}× flag threshold.`,
        [`growth.${prevKey}.salesEtb`, `growth.${nextKey}.salesEtb`],
        { fromYear: prevKey, toYear: nextKey, from: prev, to: next, multiple },
      ),
    );
  }
  return findings;
}
