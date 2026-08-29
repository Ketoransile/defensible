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

```bash
npm install
cp .env.example .env.local   # paste GEMINI_API_KEY; DEMO_ACCESS_CODE defaults to defensible
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then sign in with access code `defensible` to reach `/review`.

Reviewer copy (headline / why this rank / expand paragraph) is Gemini, cached under `cache/llm/`. Scores never come from the model.

```bash
npm run explain              # refresh cached briefs for the offline demo
```

## Deploy (Vercel)

1. Import the GitHub repo.
2. Framework: Next.js (defaults are fine).
3. Set environment variables (Production + Preview):
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-3.6-flash` (optional)
   - `DEMO_ACCESS_CODE` (judges’ login code)
   - `AUTH_SECRET` (random string for signed session cookies)
4. Deploy. `/` is the landing page; `/review` requires sign-in.

Do **not** commit `.env.local`.
