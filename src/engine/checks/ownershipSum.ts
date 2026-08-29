import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function ownershipSum(app: Application): Finding[] {
  const women = app.ownershipWomenPct;
  const men = app.ownershipMenPct;
  if (women == null || men == null) return [];
  const sum = women + men;
  if (sum === 100) return [];
  return [
    makeFinding(
      "OWNERSHIP_SUM",
      "contradiction",
      "Ownership shares do not sum to 100%",
      `Women ${women}% + men ${men}% = ${sum}%, not 100%.`,
      ["ownershipWomenPct", "ownershipMenPct"],
      { ownershipWomenPct: women, ownershipMenPct: men, sum },
    ),
  ];
}
