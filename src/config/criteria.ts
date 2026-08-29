import type { CriterionId } from "@/types";

export interface CriterionDef {
  id: CriterionId;
  label: string;
  maxPoints: number;
  sourceFields: string[];
}

export const CRITERIA: CriterionDef[] = [
  {
    id: "growth_trajectory",
    label: "Growth trajectory",
    maxPoints: 15,
    sourceFields: [
      "growth.2022.salesEtb",
      "growth.2023.salesEtb",
      "growth.2024.salesEtb",
      "growth.2025_proj.salesEtb",
      "growth.2026_proj.salesEtb",
    ],
  },
  {
    id: "job_creation",
    label: "Job creation",
    maxPoints: 20,
    sourceFields: [
      "jobPositions",
      "jobCreationNarrative",
      "growth.2026_proj.totalEmployees",
    ],
  },
  {
    id: "employment_inclusion",
    label: "Employment inclusion",
    maxPoints: 12,
    sourceFields: [
      "growth.2024.femaleEmployees",
      "growth.2024.youthEmployees",
      "growth.2024.totalEmployees",
      "ownershipWomenPct",
    ],
  },
  {
    id: "market_position",
    label: "Market position",
    maxPoints: 12,
    sourceFields: ["marketOverview", "products"],
  },
  {
    id: "uniqueness",
    label: "Uniqueness",
    maxPoints: 10,
    sourceFields: ["uniqueness", "uniqueFeatures"],
  },
  {
    id: "intervention_fit",
    label: "Intervention fit",
    maxPoints: 13,
    sourceFields: [
      "problemsToAddress",
      "equipmentRequests",
      "consultantRequests",
      "expectedResults",
    ],
  },
  {
    id: "management_capacity",
    label: "Management capacity",
    maxPoints: 8,
    sourceFields: ["managementTeam", "organogramFile"],
  },
  {
    id: "local_sourcing",
    label: "Local sourcing",
    maxPoints: 5,
    sourceFields: ["localRawMaterialPct", "keyRawMaterials"],
  },
  {
    id: "social_environmental_osh",
    label: "Social, environmental & OSH",
    maxPoints: 5,
    sourceFields: ["socialEnvironmentalImpact", "oshCommitment"],
  },
];

export const DEFAULT_WEIGHTS: Record<CriterionId, number> = Object.fromEntries(
  CRITERIA.map((c) => [c.id, c.maxPoints]),
) as Record<CriterionId, number>;

export function totalWeight(weights: Record<CriterionId, number>): number {
  return CRITERIA.reduce((sum, c) => sum + weights[c.id], 0);
}
