import type { FieldPath } from "@/types";

/** Machinery cost-share cap from the scheme: up to €12,000 from sequa. */
export const SEQUA_EQUIPMENT_CAP_EUR = 12_000;

/**
 * ETB per EUR. Reviewers can edit this in the UI.
 * Placeholder official-market rate for the demo; replace when the owner confirms.
 */
export const DEFAULT_ETB_PER_EUR = 165;

export const THRESHOLDS = {
  /** Year-on-year sales multiple that triggers SALES_JUMP (flag only). */
  salesJumpMultiple: 3,

  /**
   * Projection is a break if 2025→2026 sales growth exceeds this multiple of
   * the largest historical year-on-year growth rate.
   */
  projectionBreakFactor: 2.5,

  eligibilityMinYearsExclusive: 2,
  sequaEquipmentCapEur: SEQUA_EQUIPMENT_CAP_EUR,
  etbPerEur: DEFAULT_ETB_PER_EUR,
  maxConsultantRequests: 3,
  requiredPriorityAreas: 3,
} as const;

export type Thresholds = {
  -readonly [K in keyof typeof THRESHOLDS]: (typeof THRESHOLDS)[K];
};

/** Form-required fields. 1.7 raw materials are optional ("enter only if relevant"). */
export const REQUIRED_FIELD_PATHS: FieldPath[] = [
  "companyName",
  "businessRegistrationNumber",
  "businessLicenseNumber",
  "address",
  "cityRegion",
  "mobileNumber",
  "email",
  "businessOrgForm",
  "yearsInOperation",
  "businessType",
  "ownershipWomenPct",
  "ownershipMenPct",
  "companyOverview",
  "motivation",
  "businessGoals",
  "marketOverview",
  "uniqueness",
  "problemsToAddress",
  "priorityAreasExplanation",
  "jobCreationNarrative",
  "socialEnvironmentalImpact",
  "oshCommitment",
];
