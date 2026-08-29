# sequa SME Application Reviewer

Hackathon Challenge 1 — ranked, cited shortlist for the sequa gGmbH SME Support Scheme.

- Spec: [`BUILD-SPEC.md`](./BUILD-SPEC.md)
- **Who does what:** [`TEAM-PLAN.md`](./TEAM-PLAN.md)
- Official grid: [`docs/Company_Evaluation_grid.pdf`](./docs/Company_Evaluation_grid.pdf)

```bash
npm install
cp .env.example .env.local   # paste GEMINI_API_KEY; DEMO_ACCESS_CODE defaults to defensible
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then sign in with access code `defensible` to reach `/review`.

Scoring is deterministic TypeScript against the official sequa bands. 7a and 7b are alternative tracks, never added together. Reviewer copy is Gemini, cached under `cache/llm/`.

## MongoDB (sample applications)

Applications live in MongoDB when `MONGODB_URI` is set. If Mongo is empty or unreachable, the app falls back to `fixtures/applications/*.json`.

```bash
# Local Mongo (Docker Desktop)
npm run db:up

# Or use MongoDB Atlas — paste the URI into .env.local as MONGODB_URI

npm run db:seed    # upserts all 12 fixture applications
```

```bash
npm run explain    # refresh cached briefs for the offline demo
```

## Deploy (Vercel)

1. Import the GitHub repo.
2. Framework: Next.js (defaults are fine).
3. Set environment variables (Production + Preview):
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-3.6-flash` (optional)
   - `DEMO_ACCESS_CODE` (judges’ login code)
   - `AUTH_SECRET` (random string for signed session cookies)
   - `MONGODB_URI` (Atlas connection string)
   - `MONGODB_DB=defensible` (optional)
4. Run `npm run db:seed` once against Atlas (from your machine with the Atlas URI in `.env.local`).
5. Deploy. `/` is the landing page; `/review` requires sign-in.

Do **not** commit `.env.local`.
