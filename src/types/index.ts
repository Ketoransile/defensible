// Mirrors the sequa SME Support Scheme form.
// A CriterionScore cannot be constructed without citations or an unestablished verdict.

export type BusinessOrgForm =
  | "sole_proprietorship"
  | "private_limited_company"
  | "share_company"
  | "other";

export type UniquenessLevel =
  | "new_in_ethiopia"
  | "not_new_but_unique_features"
  | "no_unique_features";

export type ExpectedResult =
  | "new_product_service"
  | "diversification"
  | "new_clients"
  | "new_markets"
  | "production_capacity"
  | "quality"
  | "financial_sustainability";

export type GrowthYear = "2022" | "2023" | "2024" | "2025_proj" | "2026_proj";

export interface GrowthRow {
  salesEtb: number | null;
  totalEmployees: number | null;
  femaleEmployees: number | null;
  youthEmployees: number | null; // ages 18-24
}

export interface ProductLine {
  productService: string | null;
  marketServed: string | null;
  distributionChannels: string | null;
}

export interface ManagementMember {
  name: string | null;
  position: string | null;
  gender: "female" | "male" | "other" | null;
}

export interface EquipmentRequest {
  description: string | null;
  quantity: number | null;
  estimatedTotalPriceEtb: number | null;
  purpose: string | null;
}

export interface ConsultantRequest {
  problemDescription: string | null;
  technicalExpertiseRequest: string | null;
}

export interface JobPosition {
  position: string | null;
  newJobs: number | null;
}

export interface Application {
  id: string;

  // 1.1 Company profile
  companyName: string | null;
  businessRegistrationNumber: string | null;
  /** Form field: Business license registration number (separate from registration). */
  businessLicenseNumber: string | null;
  address: string | null;
  /** Form field: City and Region. */
  cityRegion: string | null;
  mobileNumber: string | null;
  email: string | null;
  businessOrgForm: BusinessOrgForm | null;
  yearsInOperation: number | null;
  businessType: string | null;
  ownershipWomenPct: number | null;
  ownershipMenPct: number | null;

  // 1.2
  companyOverview: string | null;
  growth: Record<GrowthYear, GrowthRow>;

  // 1.3 – 1.5
  motivation: string | null; // 150 char limit on form
  businessGoals: string | null; // 100 char limit
  marketOverview: string | null;

  // 1.6
  products: ProductLine[]; // up to 4
  uniqueness: UniquenessLevel | null;
  uniqueFeatures: string | null;

  // 1.7
  localRawMaterialPct: number | null;
  keyRawMaterials: string | null;

  // 1.8
  managementTeam: ManagementMember[]; // up to 5
  organogramFile: string | null; // filename or null if not uploaded

  // 2.1 – 2.3
  problemsToAddress: string | null;
  equipmentRequests: EquipmentRequest[]; // up to 4
  consultantRequests: ConsultantRequest[]; // up to 3

  // 2.4
  expectedResults: ExpectedResult[];
  priorityAreasExplanation: string | null;

  // 2.5
  jobCreationNarrative: string | null;
  jobPositions: JobPosition[]; // up to 6

  // 2.6 – 2.7
  socialEnvironmentalImpact: string | null;
  oshCommitment: string | null;
}

export type Severity = "fail" | "contradiction" | "defect" | "flag";

/** Dot path into Application, e.g. "growth.2024.femaleEmployees" */
export type FieldPath = string;

export interface Finding {
  checkId: string;
  severity: Severity;
  title: string;
  explanation: string;
  fields: FieldPath[];
  values: Record<string, unknown>;
}

/** Leaf ids from the official sequa Company Evaluation grid. */
export type CriterionId =
  | "success_story_sales"
  | "success_story_employment"
  | "uniqueness"
  | "market_served"
  | "supply_chain"
  | "ownership_gender"
  | "women_employees"
  | "youth_employees"
  | "expected_results"
  | "job_creation_employability"
  | "job_creation_investment"
  | "management_capacity"
  | "social_environmental";

export interface ScoredCriterion {
  criterionId: CriterionId;
  status: "scored";
  points: number;
  maxPoints: number;
  reasoning: string;
  citations: FieldPath[]; // MUST be non-empty
}

export interface UnestablishedCriterion {
  criterionId: CriterionId;
  status: "unestablished";
  maxPoints: number;
  reason: string;
  openQuestion: string;
  citations: FieldPath[];
}

export type CriterionScore = ScoredCriterion | UnestablishedCriterion;

export type EligibilityVerdict = "eligible" | "excluded" | "unestablished";

export interface EligibilityCheck {
  checkId: string;
  verdict: EligibilityVerdict;
  explanation: string;
  fields: FieldPath[];
  openQuestion?: string;
}

export interface EligibilityResult {
  verdict: EligibilityVerdict;
  checks: EligibilityCheck[];
}

export type JobCreationTrackId = "employability" | "investment_readiness";

export interface JobCreationTrack {
  id: JobCreationTrackId;
  criterionId: "job_creation_employability" | "job_creation_investment";
  reason: string;
  fields: FieldPath[];
}

export interface ReviewerBrief {
  /** One line for the ranked table. */
  headline: string;
  /** Why this row sits at this rank versus the rest of the batch. */
  whyThisRank: string;
  /** Expand-panel paragraph. Must not invent scores or fields. */
  justification: string;
  strengths: string[];
  watchouts: string[];
  source: "template" | "gemini";
}

export interface Assessment {
  applicationId: string;
  companyName: string | null;
  rank: number;
  eligibility: EligibilityResult;
  findings: Finding[];
  jobCreationTrack: JobCreationTrack;
  criteria: CriterionScore[];
  totalPoints: number;
  maxAvailablePoints: number;
  confidence: number; // maxAvailablePoints / GRID_MAX_POINTS — not a model self-report
  brief: ReviewerBrief;
  justification: string;
  openQuestions: string[];
}

export interface BatchResult {
  assessments: Assessment[];
  generatedAt: string;
  weightsUsed: Record<CriterionId, number>;
}

export function isScoredCriterion(
  score: CriterionScore,
): score is ScoredCriterion {
  return score.status === "scored";
}

export function isUnestablishedCriterion(
  score: CriterionScore,
): score is UnestablishedCriterion {
  return score.status === "unestablished";
}

/** Throws if a scored criterion has no citations. Call before render. */
export function assertRenderableScore(score: CriterionScore): void {
  if (score.status === "scored" && score.citations.length === 0) {
    throw new Error(
      `CriterionScore "${score.criterionId}" cannot render: scored with empty citations.`,
    );
  }
}
