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

## Deploy (Vercel)

1. Import the GitHub repo.
2. Framework: Next.js (defaults are fine).
3. Set environment variables (Production + Preview):
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-3.6-flash` (optional; this is the default)
4. Deploy. The homepage runs `explainBatch(assessBatch())` at build/request time; committed `cache/llm/` keeps the demo offline-friendly when facts hashes match.

Do **not** commit `.env.local`.
