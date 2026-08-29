import { GRID_MAX_POINTS } from "@/config/criteria";
import { loadApplications } from "@/lib/loadFixtures";
import {
  isScoredCriterion,
  type Application,
  type Assessment,
  type BatchResult,
  type CriterionScore,
} from "@/types";
import { runChecks } from "./checks";
import { evaluateEligibility } from "./eligibility";
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

function rankAssessments(a: Assessment, b: Assessment): number {
  const excluded = Number(a.eligibility.verdict === "excluded") - Number(b.eligibility.verdict === "excluded");
  if (excluded !== 0) return excluded;
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  return b.confidence - a.confidence;
}

export function assessApplication(app: Application): Assessment {
  const criteria = scoreApplication(app);
  const jobCreationTrack = selectJobCreationTrack(app);
  const eligibility = evaluateEligibility(app);
  const findings = runChecks(app);
  const { totalPoints, maxAvailablePoints, confidence } = totals(criteria);

  const openQuestions = [
    ...eligibility.checks
      .filter((c) => c.verdict !== "eligible" && c.openQuestion)
      .map((c) => c.openQuestion as string),
    ...criteria.filter((c) => c.status === "unestablished").map((c) => c.openQuestion),
    ...findings
      .filter((f) => f.severity !== "flag")
      .map((f) => `${f.title}: ${f.explanation}`),
  ];

  const trackLabel = jobCreationTrack.id.replaceAll("_", " ");

  return {
    applicationId: app.id,
    companyName: app.companyName,
    eligibility,
    findings,
    jobCreationTrack,
    criteria,
    totalPoints,
    maxAvailablePoints,
    confidence,
    justification: `${app.companyName ?? app.id} scores ${totalPoints} of ${maxAvailablePoints} established points (${trackLabel} track). Eligibility: ${eligibility.verdict}. ${findings.length} finding(s).`,
    openQuestions,
  };
}

export function assessBatch(apps: Application[] = loadApplications()): BatchResult {
  const assessments = apps.map(assessApplication).sort(rankAssessments);

  return {
    assessments,
    generatedAt: new Date().toISOString(),
    weightsUsed: Object.fromEntries(
      assessments[0]?.criteria.map((c) => [c.criterionId, c.maxPoints]) ?? [],
    ) as BatchResult["weightsUsed"],
  };
}
