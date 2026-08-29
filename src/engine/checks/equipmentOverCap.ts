import { THRESHOLDS } from "@/config/thresholds";
import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function equipmentTotalEtb(app: Application): number | null {
  const prices = app.equipmentRequests
    .map((row) => row.estimatedTotalPriceEtb)
    .filter((n): n is number => n != null);
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => a + b, 0);
}

export function equipmentOverCap(app: Application): Finding[] {
  const etb = equipmentTotalEtb(app);
  if (etb == null) return [];
  const eur = etb / THRESHOLDS.etbPerEur;
  const cap = THRESHOLDS.sequaEquipmentCapEur;
  if (eur <= cap) return [];
  return [
    makeFinding(
      "EQUIPMENT_OVER_CAP",
      "contradiction",
      "Equipment request exceeds the sequa €12,000 cap",
      `Requested equipment totals ${etb.toLocaleString("en-US")} ETB (≈ €${Math.round(eur).toLocaleString("en-US")} at ${THRESHOLDS.etbPerEur} ETB/EUR), above the €${cap.toLocaleString("en-US")} sequa contribution cap.`,
      ["equipmentRequests"],
      {
        estimatedTotalPriceEtb: etb,
        equivalentEur: eur,
        capEur: cap,
        etbPerEur: THRESHOLDS.etbPerEur,
      },
    ),
  ];
}
