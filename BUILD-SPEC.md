# BUILD SPEC — sequa SME Application Reviewer Agent

> This file is the source of truth for the build. Read it fully before writing code.
> Hackation AI Builder Hackathon Addis Ababa, 29–30 August 2026. Challenge 1, reviewer path.
> Team of 2. Stack: TypeScript, Next.js (App Router), Node. No database, JSON fixtures on disk.

---

## 1. What we are building

A batch of SME funding applications goes in. A ranked, defensible shortlist comes out.

For each application the system:
1. Runs an **eligibility gate** (mechanical, from the form's stated criteria)
2. Runs a **contradiction engine** (deterministic code, no LLM)
3. Scores the **official sequa evaluation grid** (banded, weighted, each score citing the exact fields that justify it)
4. Returns `unestablished` plus an open question wherever the data does not support a score
5. Produces a ranked list with per-company justification, findings, and site-visit questions

The reviewer screen must be **interrogable**: click any score, see the fields behind it.

### The one non-negotiable rule

**Nothing renders that is not traceable to a field in the application.**

A `CriterionScore` cannot be constructed without either field citations or an `unestablished` verdict. Enforce this in the type system, then validate every citation path against the actual application object before render. A fabricated citation on stage destroys the entire premise of the project.

The LLM never invents a number. It selects, explains, and cites. All arithmetic and all contradiction detection is plain TypeScript.

---

## 2. Domain context

The real programme: **sequa gGmbH SME Support Scheme**, under GIZ's "Job Partnerships and Promotion of Small and Medium-Sized Enterprises II" in Ethiopia.

Support offered:
- Executive coaching
- Technical expert support for **exactly three** specific problems
- Machinery/equipment cost-sharing, **up to €12,000 from sequa**

Stated eligibility criteria (verbatim from the form):
- Legally registered, SME or parent organization **more than 2 years old**
- **Privately owned** SMEs, not state-owned

Source form: https://form.jotform.com/251212903767052

### Official scoring grid

Source: `docs/Company_Evaluation_grid.pdf`. The challenge owner published the grid. We do **not** derive weights.

The LLM never invents a number. Band matching is plain TypeScript. Qualitative bands (market, green sector) are keyword rules over cited fields, not free-form model scores.

The eligibility gate and the contradiction engine are unchanged: they come from the form and are provably correct.

Weights stay in `src/config/criteria.ts` and remain visible in the UI so a reviewer can see the official bands. Do not silently replace official bands with a homemade 100-point model.

---

## 3. Types

Create `src/types/index.ts` first. Both team members read it before splitting work. Do not build behind these until they are agreed.

```ts
// ─── Application: mirrors the form exactly ───

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
  address: string | null;
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
  motivation: string | null;      // 150 char limit on form
  businessGoals: string | null;   // 100 char limit
  marketOverview: string | null;

  // 1.6
  products: ProductLine[];        // up to 4
  uniqueness: UniquenessLevel | null;
  uniqueFeatures: string | null;

  // 1.7
  localRawMaterialPct: number | null;
  keyRawMaterials: string | null;

  // 1.8
  managementTeam: ManagementMember[]; // up to 5
  organogramFile: string | null;      // filename or null if not uploaded

  // 2.1 – 2.3
  problemsToAddress: string | null;
  equipmentRequests: EquipmentRequest[];  // up to 4
  consultantRequests: ConsultantRequest[]; // up to 3

  // 2.4
  expectedResults: ExpectedResult[];
  priorityAreasExplanation: string | null;

  // 2.5
  jobCreationNarrative: string | null;
  jobPositions: JobPosition[];  // up to 6

  // 2.6 – 2.7
  socialEnvironmentalImpact: string | null;
  oshCommitment: string | null;
}

// ─── Findings: output of the contradiction engine ───

export type Severity = "fail" | "contradiction" | "defect" | "flag";

export type FieldPath = string; // dot path into Application, e.g. "growth.2024.femaleEmployees"

export interface Finding {
  checkId: string;              // stable id, e.g. "OWNERSHIP_SUM"
  severity: Severity;
  title: string;                // short, human readable
  explanation: string;          // one sentence, states the conflict plainly
  fields: FieldPath[];          // every field involved
  values: Record<string, unknown>; // the actual conflicting values, for side-by-side display
}

// ─── Scoring ───

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
  points: number;         // 0..maxPoints
  maxPoints: number;
  reasoning: string;      // one or two sentences
  citations: FieldPath[]; // MUST be non-empty
}

export interface UnestablishedCriterion {
  criterionId: CriterionId;
  status: "unestablished";
  maxPoints: number;
  reason: string;          // what is missing
  openQuestion: string;    // what to ask on the site visit, and of whom
  citations: FieldPath[];  // fields inspected, may be empty
}

export type CriterionScore = ScoredCriterion | UnestablishedCriterion;

export type EligibilityVerdict = "eligible" | "excluded" | "unestablished";

export interface EligibilityResult {
  verdict: EligibilityVerdict;
  checks: {
    checkId: string;
    verdict: EligibilityVerdict;
    explanation: string;
    fields: FieldPath[];
    openQuestion?: string;
  }[];
}

export interface Assessment {
  applicationId: string;
  companyName: string | null;
  eligibility: EligibilityResult;
  findings: Finding[];
  criteria: CriterionScore[];
  totalPoints: number;         // sum of scored points
  maxAvailablePoints: number;  // excludes unestablished criteria
  confidence: number;          // maxAvailablePoints / GRID_MAX_POINTS (100)
  justification: string;       // one paragraph
  openQuestions: string[];     // aggregated from unestablished criteria + findings
}

export interface BatchResult {
  assessments: Assessment[];   // ranked
  generatedAt: string;
  weightsUsed: Record<CriterionId, number>;
}
```

**Note on `confidence`:** it is the share of the grid we could actually establish (`maxAvailablePoints / 100`), not a model's self-report. Never ask an LLM how confident it is.

---

## 4. The contradiction engine

`src/engine/checks/` — one file per check, all pure functions `(app: Application) => Finding[]`.

No LLM. No network. No async. Fully unit tested against fixtures.

### Arithmetic
| id | Check |
|---|---|
| `OWNERSHIP_SUM` | `ownershipWomenPct + ownershipMenPct` must equal 100 |
| `FEMALE_GT_TOTAL` | `femaleEmployees > totalEmployees` in any year |
| `YOUTH_GT_TOTAL` | `youthEmployees > totalEmployees` in any year |
| `RAW_MATERIAL_RANGE` | `localRawMaterialPct` outside 0..100 |

### Cross-section
| id | Check |
|---|---|
| `YEARS_VS_HISTORY` | Reports sales/employees for a year earlier than `yearsInOperation` allows |
| `JOBS_NARRATIVE_VS_TABLE` | Number stated in `jobCreationNarrative` differs from sum of `jobPositions[].newJobs` (extract the number with an LLM, compare with code) |
| `JOBS_VS_PROJECTION` | Sum of new jobs is inconsistent with the 2025→2026 `totalEmployees` delta |
| `EQUIPMENT_OVER_CAP` | Sum of `estimatedTotalPriceEtb` exceeds the €12,000 cap at configured FX rate |
| `UNIQUENESS_UNSUPPORTED` | `uniqueness` claims unique features but `uniqueFeatures` is empty, **or** claims none while features are listed |
| `SOLE_PROP_MULTI_OWNER` | `businessOrgForm` is sole proprietorship but ownership split implies multiple shareholders |

### Form defects
| id | Check |
|---|---|
| `PRIORITY_AREAS_COUNT` | Section 2.4 requires exactly three priority areas |
| `CONSULTANT_COUNT` | More than three consultant requests, exceeding the scheme's limit |
| `ORGANOGRAM_MISSING` | Required organogram not uploaded |
| `REQUIRED_FIELD_MISSING` | Any form-required field is null |

### Plausibility (severity `flag`, never `fail`)
| id | Check |
|---|---|
| `SALES_JUMP` | Year-on-year sales growth beyond a configured multiple |
| `PROJECTION_BREAK` | Projection sharply diverges from historical trend |
| `EQUIPMENT_PRODUCT_MISMATCH` | Requested equipment has no apparent relation to listed products (LLM-assisted, always `flag`) |

Configurable thresholds go in `src/config/thresholds.ts`.

---

## 5. Eligibility gate

`src/engine/eligibility.ts`

| id | Rule | Notes |
|---|---|---|
| `AGE_OVER_2Y` | `yearsInOperation > 2` | Mechanical. Null → `unestablished` |
| `PRIVATELY_OWNED` | Not state-owned | **See below** |

**`PRIVATELY_OWNED` is deliberately `unestablished` for share companies.** The form captures `businessOrgForm` but a Share Company may have state participation, and nothing in the form settles it. Return:

- verdict: `unestablished`
- explanation: ownership structure does not exclude state participation
- openQuestion: *"Confirm shareholder register shows no state entity holding."*

This is our showcase for refusing to guess, and it uses a real gap in their own form. **Do not "solve" it by inferring from other fields.**

Excluded applications still appear in the output, ranked last, clearly marked. Never silently dropped.

---

## 6. Scoring model

`src/config/criteria.ts` — official bands, not a derived model.

`GRID_MAX_POINTS = 100`, matching the PDF footer. **7a and 7b are alternative tracks, not additive.** Pick one per application:

- Machinery/equipment requested → **7b investment readiness**
- Otherwise → **7a employability**

The unused track is omitted from the assessment, never scored as zero.

| SN | Criterion | Points | Source fields | How scored |
|---|---|---|---|---|
| 1.1 | Sales growth | 5 | `growth.2023.salesEtb`, `growth.2024.salesEtb` | YoY %: >50 → 5; 25–50 → 3; <24 → 0 |
| 1.2 | Employment | 5 | `growth.2024.totalEmployees` | >20 → 5; 11–20 → 3; 6–10 → 1; <5 → 0 |
| 2 | Uniqueness (USP) | 5 | `uniqueness`, `uniqueFeatures` | new in Ethiopia → 5; unique features → 3; essential (form has no option) → 2; none → 1 |
| 3 | Market served | 5 | `marketOverview`, `products` | international/export → 5; import substituting → 3; local → 2 |
| 4 | Supply chain | 5 | `localRawMaterialPct` | ≥75 → 5; 40–74 → 3; 20–39 → 1; <20 → 0. Null → unestablished |
| 5.1 | Ownership / managed | 5 | `ownershipWomenPct`, `managementTeam` | any women ownership → 5; else women manager → 3; else 0 |
| 5.2 | Women employees % | 5 | `growth.2024.femaleEmployees` / total | >50 → 5; 41–50 → 4; 30–40 → 3; 1–29 → 2; 0 → 0 |
| 5.3 | Youth employees % | 5 | `growth.2024.youthEmployees` / total | same bands as 5.2 |
| 6 | Expected results | 20 | `expectedResults` | 3 areas → 20; 2 → 15; 1 → 10 |
| 7a | Job creation (employability) | 25 | `jobPositions` | person-months = new jobs × 15: ≥400 → 25; 300–399 → 20; 200–299 → 15; else 0 |
| 7b | Job creation (investment readiness) | 25 | `jobPositions` | headcount: ≥25 → 25; 20–24 → 15; 15–19 → 5; else 0 |
| 8 | Management capacity | 5 | `managementTeam` | ≥4 named → 5; 3 → 3; 2 → 0 |
| 9 | Social / environmental / green | 10 | `socialEnvironmentalImpact`, `oshCommitment` | green-sector keywords → 10; both social+env → 8; one → 5; neither → 0 |

**7a unit:** person-months (`newJobs × 15`). **7b unit:** new-job headcount. Only one of them is applied.

Scoring pipeline per criterion:
1. Extract only that criterion's source fields
2. If required fields are null or unusable → `UnestablishedCriterion` with an open question. **Do not invent a band.**
3. Match the official band in TypeScript. Attach reasoning and citations.
4. **Validate every citation resolves to a real field path.**
5. Clamp points to `0..maxPoints`

`totalPoints` sums only scored criteria. `confidence` is `maxAvailablePoints / 100`. Never scale an incomplete score up to look complete.

Qualitative bands (3, 9) use cited text + keyword rules. They are still code. An LLM may later *explain* a band; it may not pick the number.

---

## 7. Fixtures

`fixtures/applications/*.json` plus `fixtures/manifest.json`.

Twelve applications. The manifest maps each to the defects it carries, and doubles as the test oracle and the source of demo numbers.

Required coverage:
1. Clean, strong applicant, no findings
2. Fails `AGE_OVER_2Y`
3. Share Company → eligibility `unestablished`
4. `OWNERSHIP_SUM` violation
5. `YEARS_VS_HISTORY` violation ← **the demo closer**
6. `UNIQUENESS_UNSUPPORTED`
7. `JOBS_NARRATIVE_VS_TABLE` mismatch
8. `EQUIPMENT_OVER_CAP`
9. `FEMALE_GT_TOTAL`
10. `PRIORITY_AREAS_COUNT` defect + `ORGANOGRAM_MISSING`
11. Sparse application → several criteria `unestablished`
12. `SALES_JUMP` flag, otherwise sound

**Fixture 5 is the demo closer.** It must score well on the grid and be pushed down by the finding: licence-era history that contradicts stated years in operation. Tune it so this lands every time.

The challenge owner will supply real sample data later. Build against fixtures now, run theirs when it arrives. Do not wait.

---

## 8. UI

`src/app/` — one screen, three views. Next.js App Router, Tailwind. Dark, dense, operator-looking. **Not a chat interface.**

**Batch view.** Ranked table: rank, company, total points, confidence, finding badges, eligibility status. Excluded rows visually distinct at the bottom. Weight sliders in a side panel that re-rank live.

**Company detail.** Official grid rows (grouped 1–9). Criterion 7 shows only the chosen track (7a or 7b) plus why. Each row expands to the matched band, reasoning, and citations. **Clicking a citation shows the actual field value from the application.** Unestablished criteria render in a distinct style with their open question, never as zero.

**Findings panel.** Each finding shows both conflicting values side by side with their field paths. This is what wins the demo. Make it clear and make it big.

Judges must be able to click anything and get an answer. If they can only watch, we lose.

---

## 9. Build order

Types, fixtures, official grid scorer, and 7a/7b track selection are done.

Split is in `TEAM-PLAN.md`. Short version:

**Amir — engine:** eligibility + contradiction checks, wire into `assess.ts`.  
**Ketoransile — UI:** batch view, company detail, citation click-through, findings panel.

Do not edit each other's folders. `assessBatch()` is the join point.

### Performance
`assessBatch` is synchronous over fixtures. Cache LLM responses to disk only if an LLM path is added later. The demo must run with the wifi off.

---

## 10. Cut list, in order

1. Justification paragraphs → template filled with cited fields
2. Weight-slider live re-ranking → static weights
3. LLM-assisted checks (`JOBS_NARRATIVE_VS_TABLE`, `EQUIPMENT_PRODUCT_MISMATCH`) → deterministic checks only
4. Plausibility flags

**Never cut:** the contradiction engine, click-to-source citations, the unestablished path.

---

## 11. Rules

1. No score renders without a validated field citation.
2. All arithmetic and contradiction detection is code, never the LLM.
3. `unestablished` is a correct answer. Never let the model fill a gap to make the grid look complete.
4. Every LLM response cached to disk. The demo must run with the wifi off.
5. Features freeze at hour 19. The rest is hardening, rehearsal, and sleep.
