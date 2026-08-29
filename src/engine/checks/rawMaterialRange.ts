import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function rawMaterialRange(app: Application): Finding[] {
  const pct = app.localRawMaterialPct;
  if (pct == null) return [];
  if (pct >= 0 && pct <= 100) return [];
  return [
    makeFinding(
      "RAW_MATERIAL_RANGE",
      "contradiction",
      "Local raw-material share is outside 0–100%",
      `localRawMaterialPct is ${pct}, which is not a percentage.`,
      ["localRawMaterialPct"],
      { localRawMaterialPct: pct },
    ),
  ];
}
