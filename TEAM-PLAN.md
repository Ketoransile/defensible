# Work split — sequa SME Reviewer

Repo: https://github.com/Ketoransile/defensible  
Spec: `BUILD-SPEC.md` · Official grid: `docs/Company_Evaluation_grid.pdf`

Do not edit each other's folders. Merge to `main` often. The contract between tracks is `Assessment` / `BatchResult` in `src/types/index.ts` and `assessBatch()` in `src/engine/assess.ts`.

---

## Already done (do not rebuild)

- Types, twelve fixtures, field-path resolver, citation validator
- Official 100-point grid, deterministic band scorer
- **7a / 7b:** pick one per case, never add them
  - equipment requested → 7b investment readiness
  - otherwise → 7a employability
- `assessBatch()` returns ranked scores so the UI can start now (eligibility + findings still empty)

---

## Amir — Engine

**Own:** `src/engine/checks/`, `src/engine/eligibility.ts`, then plug them into `src/engine/assess.ts`

**Do not touch:** `src/app/`, `src/components/`

### Build order

1. `src/engine/eligibility.ts` — `AGE_OVER_2Y`, `PRIVATELY_OWNED` (share company → `unestablished`, do not guess). Excluded apps stay in the batch, ranked last.
2. Contradiction checks, one file each, `(app) => Finding[]`, no LLM, no async. Unit test against `fixtures/manifest.json`.
   - Arithmetic: `OWNERSHIP_SUM`, `FEMALE_GT_TOTAL`, `YOUTH_GT_TOTAL`, `RAW_MATERIAL_RANGE`
   - Cross-section: `YEARS_VS_HISTORY` (demo closer — fixture `05-abyssinia-metal`), `JOBS_NARRATIVE_VS_TABLE` (regex the number), `JOBS_VS_PROJECTION`, `EQUIPMENT_OVER_CAP`, `UNIQUENESS_UNSUPPORTED`, `SOLE_PROP_MULTI_OWNER`
   - Defects: `PRIORITY_AREAS_COUNT`, `CONSULTANT_COUNT`, `ORGANOGRAM_MISSING`, `REQUIRED_FIELD_MISSING`
3. Wire checks + eligibility into `assessApplication` so `findings`, `eligibility`, and `openQuestions` are real.
4. Ranking: excluded last; then `totalPoints` desc; then `confidence` desc.
5. If time: plausibility flags (`SALES_JUMP`, `PROJECTION_BREAK`). Cut if needed.

**Done when:** `npm test` covers the manifest (each fixture triggers its `expectedChecks`), Abyssinia Metalworks is the demo closer (`YEARS_VS_HISTORY` on a high-scoring application).

---

## Ketoransile — Reviewer UI

**Own:** `src/app/`, `src/components/`

**Do not touch:** `src/engine/checks/`, `src/engine/eligibility.ts`

Import `assessBatch` and `explainBatch` from `@/engine`. `await explainBatch(assessBatch())` fills Gemini (or template) copy. Read applications with `loadApplication(id)` when a citation is clicked.

Table row: `rank`, `brief.headline`, points, confidence, eligibility, finding badges.  
Expand: `brief.whyThisRank`, `brief.justification`, `brief.strengths`, `brief.watchouts`, then criteria + findings.

### Build order

1. Dark, dense, operator screen. Not a chat.
2. **Batch view** — ranked table: rank, company, points, confidence, eligibility, finding badges. Excluded rows distinct, at the bottom. Show which 7-track was used.
3. **Company detail** — grid groups 1–9. Only the chosen 7a or 7b row. Expand a score → band + reasoning + citations. Unestablished is not rendered as zero.
4. **Click a citation → show the live field value** from the application (`getField`). This is non-negotiable.
5. **Findings panel** — both conflicting values, side by side, with field paths. Big and obvious. Empty findings until engine lands is fine; keep the layout.
6. If time: weight sliders that re-rank. Cut to static official weights if needed.

**Done when:** a judge can click Alem Leather, then Abyssinia Metalworks, and see every score traced to a field, and see the years-vs-history finding without a voiceover.

---

## Shared freeze

Do not change unless you both agree in chat:

- `src/types/index.ts`
- `src/config/criteria.ts` (official bands)
- `fixtures/applications/*.json`

If the UI needs a field on `Assessment`, add it in types first and tell the other person.

---

## Merge rule

Small PRs or direct pushes to `main`. Pull before you push. If `assess.ts` conflicts: engine owns findings/eligibility; UI should not restyle that file — consume the type.

Demo never-cut list: contradiction engine, click-to-source citations, `unestablished`.
