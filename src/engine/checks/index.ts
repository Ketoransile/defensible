import type { Application, Finding } from "@/types";
import type { CheckFn } from "./helpers";
import { consultantCount } from "./consultantCount";
import { equipmentOverCap } from "./equipmentOverCap";
import { femaleGtTotal } from "./femaleGtTotal";
import { jobsNarrativeVsTable } from "./jobsNarrativeVsTable";
import { jobsVsProjection } from "./jobsVsProjection";
import { organogramMissing } from "./organogramMissing";
import { ownershipSum } from "./ownershipSum";
import { priorityAreasCount } from "./priorityAreasCount";
import { projectionBreak } from "./projectionBreak";
import { rawMaterialRange } from "./rawMaterialRange";
import { requiredFieldMissing } from "./requiredFieldMissing";
import { salesJump } from "./salesJump";
import { solePropMultiOwner } from "./solePropMultiOwner";
import { uniquenessUnsupported } from "./uniquenessUnsupported";
import { yearsVsHistory } from "./yearsVsHistory";
import { youthGtTotal } from "./youthGtTotal";

export const CHECKS: CheckFn[] = [
  ownershipSum,
  femaleGtTotal,
  youthGtTotal,
  rawMaterialRange,
  yearsVsHistory,
  jobsNarrativeVsTable,
  jobsVsProjection,
  equipmentOverCap,
  uniquenessUnsupported,
  solePropMultiOwner,
  priorityAreasCount,
  consultantCount,
  organogramMissing,
  requiredFieldMissing,
  salesJump,
  projectionBreak,
];

export function runChecks(app: Application): Finding[] {
  return CHECKS.flatMap((check) => check(app));
}
