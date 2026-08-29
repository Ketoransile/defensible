import { GRID_MAX_POINTS } from "@/config/criteria";
import { loadApplications } from "@/lib/loadFixtures";
import {
  isScoredCriterion,
  type Application,
  type Assessment,
  type BatchResult,
  type CriterionScore,
} from "@/types";
import { scoreApplication, selectJobCreationTrack } from "./score";

function totals(criteria: CriterionScore[]): {
  totalPoints: number;
  maxAvailablePoints: number;
  confidence: number;
} {
  const totalPoints = criteria
    .filter(isScoredCriterion)
    .reduce((sum, c) => sum + c.points, 0);
  const maxAvailablePoints = criteria
    .filter((c) => c.status === "scored")
    .reduce((sum, c) => sum + c.maxPoints, 0);
  return {
    totalPoints,
    maxAvailablePoints,
    confidence: maxAvailablePoints / GRID_MAX_POINTS,
  };
}

/**
 * Assembles one assessment. Eligibility and findings are filled by the
 * engine track (`eligibility.ts`, `checks/`). Until those land, they are
 * empty so the UI can render scores immediately.
 */
export function assessApplication(app: Application): Assessment {
  const criteria = scoreApplication(app);
  const jobCreationTrack = selectJobCreationTrack(app);
  const { totalPoints, maxAvailablePoints, confidence } = totals(criteria);
  const openQuestions = criteria
    .filter((c) => c.status === "unestablished")
    .map((c) => c.openQuestion);

  return {
    applicationId: app.id,
    companyName: app.companyName,
    eligibility: {
      verdict: "eligible",
      checks: [],
    },
    findings: [],
    jobCreationTrack,
    criteria,
    totalPoints,
    maxAvailablePoints,
    confidence,
    justification: `${app.companyName ?? app.id} scores ${totalPoints} of ${maxAvailablePoints} established points on the ${jobCreationTrack.id.replace("_", " ")} track.`,
    openQuestions,
  };
}

export function assessBatch(apps: Application[] = loadApplications()): BatchResult {
  const assessments = apps
    .map(assessApplication)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.confidence - a.confidence);

  return {
    assessments,
    generatedAt: new Date().toISOString(),
    weightsUsed: Object.fromEntries(
      assessments[0]?.criteria.map((c) => [c.criterionId, c.maxPoints]) ?? [],
    ) as BatchResult["weightsUsed"],
  };
}
