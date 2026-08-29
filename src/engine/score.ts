import {
  ENVIRONMENTAL_IMPACT_RE,
  GREEN_SECTOR_RE,
  IMPORT_SUBSTITUTE_RE,
  INTERNATIONAL_MARKET_RE,
  SOCIAL_IMPACT_RE,
  WOMEN_MANAGER_RE,
  activeCriteria,
  criterionById,
} from "@/config/criteria";
import { THRESHOLDS } from "@/config/thresholds";
import { isPresent } from "@/lib/fields";
import type {
  Application,
  CriterionId,
  CriterionScore,
  FieldPath,
  JobCreationTrack,
  UnestablishedCriterion,
} from "@/types";

function scored(
  id: CriterionId,
  points: number,
  reasoning: string,
  citations: FieldPath[],
): CriterionScore {
  const def = criterionById(id);
  if (citations.length === 0) {
    throw new Error(`Scored criterion ${id} requires citations`);
  }
  return {
    criterionId: id,
    status: "scored",
    points: Math.min(Math.max(points, 0), def.maxPoints),
    maxPoints: def.maxPoints,
    reasoning,
    citations,
  };
}

function unestablished(
  id: CriterionId,
  reason: string,
  openQuestion: string,
  citations: FieldPath[],
): UnestablishedCriterion {
  return {
    criterionId: id,
    status: "unestablished",
    maxPoints: criterionById(id).maxPoints,
    reason,
    openQuestion,
    citations,
  };
}

export function newJobsTotal(app: Application): number | null {
  const values = app.jobPositions
    .map((p) => p.newJobs)
    .filter((n): n is number => n != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0);
}

export function sharePct(
  part: number | null,
  total: number | null,
): number | null {
  if (part == null || total == null || total <= 0) return null;
  return (part / total) * 100;
}

export function salesGrowthPct(app: Application): number | null {
  const prior = app.growth["2023"].salesEtb;
  const latest = app.growth["2024"].salesEtb;
  if (prior == null || latest == null || prior <= 0) return null;
  return ((latest - prior) / prior) * 100;
}

function namedManagers(app: Application): number {
  return app.managementTeam.filter((m) => isPresent(m.name)).length;
}

function isWomenManaged(app: Application): boolean {
  return app.managementTeam.some(
    (m) =>
      m.gender === "female" &&
      isPresent(m.position) &&
      WOMEN_MANAGER_RE.test(m.position ?? ""),
  );
}

function marketCorpus(app: Application): string {
  const productMarkets = app.products
    .map((p) => [p.marketServed, p.distributionChannels].filter(Boolean).join(" "))
    .join(" ");
  return `${app.marketOverview ?? ""} ${app.companyOverview ?? ""} ${productMarkets}`;
}

function impactCorpus(app: Application): string {
  return `${app.socialEnvironmentalImpact ?? ""} ${app.oshCommitment ?? ""} ${app.businessType ?? ""}`;
}

function scoreSales(app: Application): CriterionScore {
  const growth = salesGrowthPct(app);
  if (growth == null) {
    return unestablished(
      "success_story_sales",
      "2023 and 2024 sales are missing or 2023 is zero, so year-on-year growth cannot be computed.",
      "Ask finance for audited 2023 and 2024 sales in ETB.",
      ["growth.2023.salesEtb", "growth.2024.salesEtb"],
    );
  }
  const points = growth > 50 ? 5 : growth >= 25 ? 3 : 0;
  const band = growth > 50 ? "A. > 50%" : growth >= 25 ? "B. 25–50%" : "D. < 24%";
  return scored(
    "success_story_sales",
    points,
    `2023→2024 sales growth is ${growth.toFixed(1)}% (${band}).`,
    ["growth.2023.salesEtb", "growth.2024.salesEtb"],
  );
}

function scoreEmployment(app: Application): CriterionScore {
  const n = app.growth["2024"].totalEmployees;
  if (n == null) {
    return unestablished(
      "success_story_employment",
      "2024 headcount is missing.",
      "Confirm current total employees with HR or the payroll register.",
      ["growth.2024.totalEmployees"],
    );
  }
  const points = n > 20 ? 5 : n >= 11 ? 3 : n >= 6 ? 1 : 0;
  return scored(
    "success_story_employment",
    points,
    `2024 total employees are ${n}.`,
    ["growth.2024.totalEmployees"],
  );
}

function scoreUniqueness(app: Application): CriterionScore {
  if (app.uniqueness == null) {
    return unestablished(
      "uniqueness",
      "Product/service uniqueness was not stated.",
      "Ask the founder which uniqueness option on the form applies, and for evidence of the USP.",
      ["uniqueness"],
    );
  }
  if (app.uniqueness === "new_in_ethiopia") {
    return scored(
      "uniqueness",
      5,
      "Applicant selected new product/service in Ethiopia.",
      ["uniqueness", "uniqueFeatures"].filter((p) =>
        p === "uniqueness" || isPresent(app.uniqueFeatures),
      ),
    );
  }
  if (app.uniqueness === "not_new_but_unique_features") {
    const citations: FieldPath[] = ["uniqueness"];
    if (isPresent(app.uniqueFeatures)) citations.push("uniqueFeatures");
    return scored(
      "uniqueness",
      3,
      isPresent(app.uniqueFeatures)
        ? "Not new to Ethiopia; unique features are described."
        : "Not new to Ethiopia with unique features claimed (feature text is empty — see UNIQUENESS_UNSUPPORTED).",
      citations,
    );
  }
  return scored(
    "uniqueness",
    1,
    "Applicant selected no unique features.",
    ["uniqueness"],
  );
}

function scoreMarket(app: Application): CriterionScore {
  const text = marketCorpus(app);
  if (!isPresent(app.marketOverview) && app.products.every((p) => !isPresent(p.marketServed))) {
    return unestablished(
      "market_served",
      "Market overview and product markets are empty.",
      "Ask where customers are and whether any sales are export or import-substituting.",
      ["marketOverview", "products"],
    );
  }
  if (INTERNATIONAL_MARKET_RE.test(text)) {
    return scored(
      "market_served",
      5,
      "Market text reaches an international or export destination.",
      ["marketOverview", "products"],
    );
  }
  if (IMPORT_SUBSTITUTE_RE.test(text)) {
    return scored(
      "market_served",
      3,
      "Market text claims import substitution.",
      ["marketOverview"],
    );
  }
  return scored(
    "market_served",
    2,
    "Market text describes a local or domestic market only.",
    ["marketOverview", "products"],
  );
}

function scoreSupply(app: Application): CriterionScore {
  const pct = app.localRawMaterialPct;
  if (pct == null) {
    return unestablished(
      "supply_chain",
      "Local raw-material percentage was not entered (optional on the form if not relevant).",
      "If the business uses raw materials, ask what share is sourced in Ethiopia.",
      ["localRawMaterialPct"],
    );
  }
  const points = pct >= 75 ? 5 : pct >= 40 ? 3 : pct >= 20 ? 1 : 0;
  return scored(
    "supply_chain",
    points,
    `Local raw material share is ${pct}%.`,
    isPresent(app.keyRawMaterials)
      ? ["localRawMaterialPct", "keyRawMaterials"]
      : ["localRawMaterialPct"],
  );
}

function scoreOwnership(app: Application): CriterionScore {
  if (app.ownershipWomenPct == null) {
    return unestablished(
      "ownership_gender",
      "Women ownership percentage is missing.",
      "Ask for the shareholder register split by gender.",
      ["ownershipWomenPct"],
    );
  }
  if (app.ownershipWomenPct > 0) {
    return scored(
      "ownership_gender",
      5,
      `Women own ${app.ownershipWomenPct}% of the company (partly or fully).`,
      ["ownershipWomenPct"],
    );
  }
  if (isWomenManaged(app)) {
    const idx = app.managementTeam.findIndex(
      (m) => m.gender === "female" && WOMEN_MANAGER_RE.test(m.position ?? ""),
    );
    return scored(
      "ownership_gender",
      3,
      "No women ownership; a woman holds a managing role.",
      ["ownershipWomenPct", `managementTeam.${idx}.gender`],
    );
  }
  return scored(
    "ownership_gender",
    0,
    "No women ownership and no woman in a managing role.",
    ["ownershipWomenPct", "managementTeam"],
  );
}

function scoreShare(
  id: "women_employees" | "youth_employees",
  partPath: FieldPath,
  part: number | null,
  total: number | null,
  noun: string,
  openWhom: string,
): CriterionScore {
  const pct = sharePct(part, total);
  if (pct == null) {
    return unestablished(
      id,
      `Cannot compute the ${noun} share: headcount figures are missing or total is zero.`,
      `Ask ${openWhom} for 2024 ${noun} and total employees.`,
      [partPath, "growth.2024.totalEmployees"],
    );
  }
  const points = pct > 50 ? 5 : pct >= 41 ? 4 : pct >= 30 ? 3 : pct >= 1 ? 2 : 0;
  return scored(
    id,
    points,
    `${noun} are ${pct.toFixed(1)}% of 2024 employees.`,
    [partPath, "growth.2024.totalEmployees"],
  );
}

function scoreExpected(app: Application): CriterionScore {
  const n = app.expectedResults.length;
  if (n === 0) {
    return unestablished(
      "expected_results",
      "No priority areas were selected.",
      "Ask the applicant to name up to three expected results the support will achieve.",
      ["expectedResults"],
    );
  }
  const points = n >= 3 ? 20 : n === 2 ? 15 : 10;
  return scored(
    "expected_results",
    points,
    `${n} expected-result area(s) selected.`,
    isPresent(app.priorityAreasExplanation)
      ? ["expectedResults", "priorityAreasExplanation"]
      : ["expectedResults"],
  );
}

function scoreEmployability(app: Application): CriterionScore {
  const jobs = newJobsTotal(app);
  if (jobs == null) {
    return unestablished(
      "job_creation_employability",
      "No new-job figures in the positions table.",
      "Ask HR to complete the job-creation table for the next 15 months.",
      ["jobPositions"],
    );
  }
  const personMonths = jobs * THRESHOLDS.jobHorizonMonths;
  const points =
    personMonths >= 400 ? 25 : personMonths >= 300 ? 20 : personMonths >= 200 ? 15 : 0;
  return scored(
    "job_creation_employability",
    points,
    `${jobs} new jobs × ${THRESHOLDS.jobHorizonMonths} months = ${personMonths} person-months. Official 7a bands start at 200.`,
    ["jobPositions"],
  );
}

function scoreInvestmentJobs(app: Application): CriterionScore {
  const jobs = newJobsTotal(app);
  if (jobs == null) {
    return unestablished(
      "job_creation_investment",
      "No new-job figures in the positions table.",
      "Ask HR how many posts will be created in the next 15 months.",
      ["jobPositions"],
    );
  }
  const points = jobs >= 25 ? 25 : jobs >= 20 ? 15 : jobs >= 15 ? 5 : 0;
  return scored(
    "job_creation_investment",
    points,
    `Job table sums to ${jobs} new jobs.`,
    ["jobPositions"],
  );
}

function scoreManagement(app: Application): CriterionScore {
  const n = namedManagers(app);
  if (n === 0) {
    return unestablished(
      "management_capacity",
      "No named core management team members.",
      "Ask for the names and roles of the core management team, and the organogram.",
      ["managementTeam"],
    );
  }
  const points = n >= 4 ? 5 : n === 3 ? 3 : 0;
  const citations: FieldPath[] = ["managementTeam"];
  if (app.organogramFile) citations.push("organogramFile");
  return scored(
    "management_capacity",
    points,
    `${n} named core management team member(s).`,
    citations,
  );
}

function scoreSocialEnv(app: Application): CriterionScore {
  const text = impactCorpus(app);
  if (
    !isPresent(app.socialEnvironmentalImpact) &&
    !isPresent(app.oshCommitment)
  ) {
    return unestablished(
      "social_environmental",
      "Social/environmental impact and OSH commitment are empty.",
      "Ask about social impact, environmental practices, and whether the model is in a green sector.",
      ["socialEnvironmentalImpact", "oshCommitment"],
    );
  }
  if (GREEN_SECTOR_RE.test(text)) {
    return scored(
      "social_environmental",
      10,
      "Text matches a green-sector or green-transition marker from the official list.",
      ["socialEnvironmentalImpact", "businessType"],
    );
  }
  const social = SOCIAL_IMPACT_RE.test(text);
  const env = ENVIRONMENTAL_IMPACT_RE.test(text);
  if (social && env) {
    return scored(
      "social_environmental",
      8,
      "Both social and environmental impact are described.",
      ["socialEnvironmentalImpact", "oshCommitment"],
    );
  }
  if (social || env) {
    return scored(
      "social_environmental",
      5,
      social
        ? "Positive social impact is described; environmental impact is not established."
        : "Positive environmental impact is described; social impact is not established.",
      ["socialEnvironmentalImpact", "oshCommitment"],
    );
  }
  return scored(
    "social_environmental",
    0,
    "Impact text does not establish a positive social or environmental effect.",
    ["socialEnvironmentalImpact", "oshCommitment"],
  );
}

const SCORERS: Record<CriterionId, (app: Application) => CriterionScore> = {
  success_story_sales: scoreSales,
  success_story_employment: scoreEmployment,
  uniqueness: scoreUniqueness,
  market_served: scoreMarket,
  supply_chain: scoreSupply,
  ownership_gender: scoreOwnership,
  women_employees: (app) =>
    scoreShare(
      "women_employees",
      "growth.2024.femaleEmployees",
      app.growth["2024"].femaleEmployees,
      app.growth["2024"].totalEmployees,
      "women employees",
      "HR",
    ),
  youth_employees: (app) =>
    scoreShare(
      "youth_employees",
      "growth.2024.youthEmployees",
      app.growth["2024"].youthEmployees,
      app.growth["2024"].totalEmployees,
      "youth employees",
      "HR",
    ),
  expected_results: scoreExpected,
  job_creation_employability: scoreEmployability,
  job_creation_investment: scoreInvestmentJobs,
  management_capacity: scoreManagement,
  social_environmental: scoreSocialEnv,
};

export function hasEquipmentRequest(app: Application): boolean {
  return app.equipmentRequests.some(
    (row) =>
      isPresent(row.description) ||
      (row.estimatedTotalPriceEtb != null && row.estimatedTotalPriceEtb > 0),
  );
}

/**
 * 7a and 7b are alternative cases, not additive.
 * Equipment request → investment readiness (7b). Otherwise employability (7a).
 */
export function selectJobCreationTrack(app: Application): JobCreationTrack {
  if (hasEquipmentRequest(app)) {
    return {
      id: "investment_readiness",
      criterionId: "job_creation_investment",
      reason:
        "Applicant requested machinery/equipment, so criterion 7 is scored as investment readiness (7b), not employability (7a).",
      fields: ["equipmentRequests"],
    };
  }
  return {
    id: "employability",
    criterionId: "job_creation_employability",
    reason:
      "No machinery/equipment request, so criterion 7 is scored as employability (7a), not investment readiness (7b).",
    fields: ["equipmentRequests"],
  };
}

export function scoreApplication(app: Application): CriterionScore[] {
  const track = selectJobCreationTrack(app);
  return activeCriteria(track.criterionId).map((c) => SCORERS[c.id](app));
}
