import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function solePropMultiOwner(app: Application): Finding[] {
  if (app.businessOrgForm !== "sole_proprietorship") return [];
  const women = app.ownershipWomenPct;
  const men = app.ownershipMenPct;
  if (women == null || men == null) return [];
  if (!(women > 0 && men > 0)) return [];
  return [
    makeFinding(
      "SOLE_PROP_MULTI_OWNER",
      "contradiction",
      "Sole proprietorship with a split ownership register",
      `Legal form is sole proprietorship, but ownership is split ${women}% women / ${men}% men.`,
      ["businessOrgForm", "ownershipWomenPct", "ownershipMenPct"],
      {
        businessOrgForm: app.businessOrgForm,
        ownershipWomenPct: women,
        ownershipMenPct: men,
      },
    ),
  ];
}
