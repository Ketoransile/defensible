# sequa SME Application Reviewer

Hackathon Challenge 1 — ranked, cited shortlist for the sequa gGmbH SME Support Scheme.

- Spec: [`BUILD-SPEC.md`](./BUILD-SPEC.md)
- **Who does what:** [`TEAM-PLAN.md`](./TEAM-PLAN.md)
- Official grid: [`docs/Company_Evaluation_grid.pdf`](./docs/Company_Evaluation_grid.pdf)

```bash
npm install
npm test
npm run dev
```

No database. Applications are JSON in `fixtures/`. Scoring is deterministic TypeScript against the official bands. 7a and 7b are alternative tracks, never added together.

Reviewer copy (headline / why this rank / expand paragraph) is Gemini, cached under `cache/llm/`. Scores never come from the model.

```bash
cp .env.example .env.local   # then paste GEMINI_API_KEY
npm run explain              # writes cached briefs for the offline demo
```

