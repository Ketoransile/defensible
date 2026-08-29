import type { CriterionId, FieldPath } from "@/types";

/**
 * Official sequa Company Evaluation grid.
 * Source: docs/Company_Evaluation_grid.pdf
 *
 * 7a (employability) and 7b (investment readiness) are alternative
 * tracks, not additive. One is chosen per application. That makes the
 * live grid 100 points, matching the PDF footer.
 */
export const GRID_MAX_POINTS = 100;

export const JOB_TRACK_IDS = [
  "job_creation_employability",
  "job_creation_investment",
] as const;

export interface ScoreBand {
  label: string;
  points: number;
}

export interface CriterionDef {
  id: CriterionId;
  sn: string;
  label: string;
  groupId: string;
  groupLabel: string;
  maxPoints: number;
  sourceFields: FieldPath[];
  bands: ScoreBand[];
}

export const CRITERIA: CriterionDef[] = [
  {
    id: "success_story_sales",
    sn: "1.1",
    label: "Sales growth",
    groupId: "success_story",
    groupLabel: "1. Success story of the company",
    maxPoints: 5,
    sourceFields: ["growth.2023.salesEtb", "growth.2024.salesEtb"],
    bands: [
      { label: "A. > 50%", points: 5 },
      { label: "B. 25–50%", points: 3 },
      { label: "D. < 24%", points: 0 },
    ],
  },
  {
    id: "success_story_employment",
    sn: "1.2",
    label: "Employment (headcount)",
    groupId: "success_story",
    groupLabel: "1. Success story of the company",
    maxPoints: 5,
    sourceFields: ["growth.2024.totalEmployees"],
    bands: [
      { label: "A. > 20", points: 5 },
      { label: "B. 11–20", points: 3 },
      { label: "C. 6–10", points: 1 },
      { label: "D. < 5", points: 0 },
    ],
  },
  {
    id: "uniqueness",
    sn: "2",
    label: "Level of uniqueness (USP) of product/service",
    groupId: "uniqueness",
    groupLabel: "2. Level of uniqueness (USP) of product/service",
    maxPoints: 5,
    sourceFields: ["uniqueness", "uniqueFeatures"],
    bands: [
      { label: "A. New products/service in Ethiopia", points: 5 },
      {
        label:
          "B. Products not new to Ethiopia but different from competitors (with unique feature)",
        points: 3,
      },
      { label: "C. Essential products to Ethiopia", points: 2 },
      { label: "D. Products with no unique features", points: 1 },
    ],
  },
  {
    id: "market_served",
    sn: "3",
    label: "Market served",
    groupId: "market_served",
    groupLabel: "3. Market served",
    maxPoints: 5,
    sourceFields: ["marketOverview", "products"],
    bands: [
      { label: "A. Product/service reachable to international market", points: 5 },
      { label: "B. Import substituting product/service", points: 3 },
      { label: "C. Product/service reachable to local market", points: 2 },
    ],
  },
  {
    id: "supply_chain",
    sn: "4",
    label: "Supply chain (raw material)",
    groupId: "supply_chain",
    groupLabel: "4. Supply chain (raw material)",
    maxPoints: 5,
    sourceFields: ["localRawMaterialPct", "keyRawMaterials"],
    bands: [
      { label: "A. ≥ 75% availability from local source", points: 5 },
      { label: "B. 40–74% of the raw material from local source", points: 3 },
      { label: "C. 20–39% of the raw material from local source", points: 1 },
      { label: "D. < 20% of the raw material from local source", points: 0 },
    ],
  },
  {
    id: "ownership_gender",
    sn: "5.1",
    label: "Business ownership / managed",
    groupId: "demography",
    groupLabel: "5. Business ownership and demography",
    maxPoints: 5,
    sourceFields: ["ownershipWomenPct", "managementTeam"],
    bands: [
      { label: "A. Women owned (partly or fully)", points: 5 },
      { label: "B. Not women owned but women managed", points: 3 },
      { label: "C. Not women owned and not women managed", points: 0 },
    ],
  },
  {
    id: "women_employees",
    sn: "5.2",
    label: "Percentage of women employees",
    groupId: "demography",
    groupLabel: "5. Business ownership and demography",
    maxPoints: 5,
    sourceFields: [
      "growth.2024.femaleEmployees",
      "growth.2024.totalEmployees",
    ],
    bands: [
      { label: "A. more than 50%", points: 5 },
      { label: "B. 41–50%", points: 4 },
      { label: "C. 30–40%", points: 3 },
      { label: "D. 1–29%", points: 2 },
      { label: "E. 0%", points: 0 },
    ],
  },
  {
    id: "youth_employees",
    sn: "5.3",
    label: "Percentage of youth employees",
    groupId: "demography",
    groupLabel: "5. Business ownership and demography",
    maxPoints: 5,
    sourceFields: ["growth.2024.youthEmployees", "growth.2024.totalEmployees"],
    bands: [
      { label: "A. more than 50%", points: 5 },
      { label: "B. 41–50%", points: 4 },
      { label: "C. 30–40%", points: 3 },
      { label: "D. 1–29%", points: 2 },
      { label: "E. 0%", points: 0 },
    ],
  },
  {
    id: "expected_results",
    sn: "6",
    label: "Expected result from the intervention",
    groupId: "expected_results",
    groupLabel: "6. Expected result from the intervention",
    maxPoints: 20,
    sourceFields: ["expectedResults", "priorityAreasExplanation"],
    bands: [
      { label: "A. The intervention can achieve 3 of the expected results", points: 20 },
      { label: "B. The intervention can achieve 2 of the expected results", points: 15 },
      { label: "C. The intervention can achieve 1 of the expected results", points: 10 },
    ],
  },
  {
    id: "job_creation_employability",
    sn: "7a",
    label: "Job creation potential (employability)",
    groupId: "job_creation",
    groupLabel: "7. Job creation potential",
    maxPoints: 25,
    sourceFields: ["jobPositions", "jobCreationNarrative"],
    bands: [
      { label: "A. ≥ 400 person-months (new jobs × 15 months)", points: 25 },
      { label: "B. 300–399 person-months", points: 20 },
      { label: "C. 200–299 person-months", points: 15 },
    ],
  },
  {
    id: "job_creation_investment",
    sn: "7b",
    label: "Job creation potential (investment readiness)",
    groupId: "job_creation",
    groupLabel: "7. Job creation potential",
    maxPoints: 25,
    sourceFields: ["jobPositions"],
    bands: [
      { label: "A. ≥ 25 new jobs", points: 25 },
      { label: "B. 20–24 new jobs", points: 15 },
      { label: "C. 15–19 new jobs", points: 5 },
    ],
  },
  {
    id: "management_capacity",
    sn: "8",
    label: "Management capacity",
    groupId: "management_capacity",
    groupLabel: "8. Management capacity",
    maxPoints: 5,
    sourceFields: ["managementTeam", "organogramFile"],
    bands: [
      { label: "A. SME having 4 or more core management team", points: 5 },
      { label: "B. SME having 3 core management team", points: 3 },
      { label: "C. SME having 2 core management team", points: 0 },
    ],
  },
  {
    id: "social_environmental",
    sn: "9",
    label: "Positive social and environmental impact / green sector",
    groupId: "social_environmental",
    groupLabel: "9. Positive social and environmental impact / green sector",
    maxPoints: 10,
    sourceFields: ["socialEnvironmentalImpact", "oshCommitment", "businessType"],
    bands: [
      {
        label:
          "A. Green business model or transitioning (renewable energy, recycling, eco-tourism, …)",
        points: 10,
      },
      { label: "B. Both positive social and environmental impact", points: 8 },
      { label: "C. Either positive social or environmental impact", points: 5 },
      { label: "D. No positive social nor environmental impact", points: 0 },
    ],
  },
];

export const DEFAULT_WEIGHTS: Record<CriterionId, number> = Object.fromEntries(
  CRITERIA.map((c) => [c.id, c.maxPoints]),
) as Record<CriterionId, number>;

export function criterionById(id: CriterionId): CriterionDef {
  const found = CRITERIA.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown criterion: ${id}`);
  return found;
}

export type JobTrackId = (typeof JOB_TRACK_IDS)[number];

export function activeCriteria(jobTrack: JobTrackId): CriterionDef[] {
  return CRITERIA.filter((c) => {
    if (c.id === "job_creation_employability" || c.id === "job_creation_investment") {
      return c.id === jobTrack;
    }
    return true;
  });
}

export function totalWeight(weights: Record<CriterionId, number>): number {
  return CRITERIA.reduce((sum, c) => sum + weights[c.id], 0);
}

export function activeWeightSum(jobTrack: JobTrackId): number {
  return activeCriteria(jobTrack).reduce((sum, c) => sum + c.maxPoints, 0);
}

export const GREEN_SECTOR_RE =
  /renewable|solar|wind|hydro|energy[\s-]*efficient|electric mobility|organic|sustainable agriculture|sustainable forest|recycl|water[\s-]*sav|eco[\s-]*tourism|green business|tannin|chrome[\s-]*free/i;

export const SOCIAL_IMPACT_RE =
  /women|youth|communit|woreda|disabilit|worker'?s? rights|inclusive|livelihood|training|local employment/i;

export const ENVIRONMENTAL_IMPACT_RE =
  /environment|waste|emission|pollut|water|forest|climate|tannin|chrome|dust|osh|ppe|recycl/i;

export const INTERNATIONAL_MARKET_RE =
  /international|export|kenya|djibouti|somalia|sudan|uganda|rwanda|abroad|foreign|east africa|nairobi/i;

export const IMPORT_SUBSTITUTE_RE = /import substitut/i;

export const WOMEN_MANAGER_RE =
  /managing director|chief executive|ceo|general manager|owner|proprietor|founder/i;
