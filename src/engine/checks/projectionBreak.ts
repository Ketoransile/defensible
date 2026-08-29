import { THRESHOLDS } from "@/config/thresholds";
import type { Application, Finding } from "@/types";
import { HISTORICAL_YEARS, makeFinding } from "./helpers";

export function projectionBreak(app: Application): Finding[] {
  const rates: number[] = [];
  for (let i = 1; i < HISTORICAL_YEARS.length; i++) {
    const prev = app.growth[HISTORICAL_YEARS[i - 1]].salesEtb;
    const next = app.growth[HISTORICAL_YEARS[i]].salesEtb;
    if (prev == null || next == null || prev <= 0) continue;
    rates.push(next / prev);
  }
  const from = app.growth["2025_proj"].salesEtb;
  const to = app.growth["2026_proj"].salesEtb;
  if (rates.length === 0 || from == null || to == null || from <= 0) return [];
  const histMax = Math.max(...rates);
  const proj = to / from;
  const limit = histMax * THRESHOLDS.projectionBreakFactor;
  if (proj <= limit) return [];
  return [
    makeFinding(
      "PROJECTION_BREAK",
      "flag",
      "2026 sales projection breaks from the historical trend",
      `2025→2026 sales grow ${proj.toFixed(1)}×, more than ${THRESHOLDS.projectionBreakFactor}× the largest historical year-on-year multiple (${histMax.toFixed(1)}×).`,
      ["growth.2025_proj.salesEtb", "growth.2026_proj.salesEtb"],
      { projectionMultiple: proj, historicalMaxMultiple: histMax, limit },
    ),
  ];
}
