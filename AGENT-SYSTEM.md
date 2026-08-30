# Defensible — How the reviewer agent works

**Hackathon Challenge 1 · sequa SME Support Scheme (Ethiopia)**  
A batch of SME funding applications goes in. A ranked, cited, interrogable shortlist comes out.

This note is the presentation walkthrough: what the system is, how each layer decides, and what a judge should click.

---

## 1. The one-sentence pitch

Defensible is a **reviewer agent**, not a chatbot that “scores companies.”

It reads the sequa application form, **gates eligibility in code**, **detects contradictions in code**, **awards official grid points in code**, then uses Gemini only to **explain and answer questions about those facts**. Every score a reviewer sees is traceable to a field. The model never invents a number.

---

## 2. The problem it solves

sequa / GIZ’s SME Support Scheme funds Ethiopian SMEs with coaching, three technical-expert problems, and equipment cost-share (up to €12,000). Reviewers must rank a batch on an official 100-point grid.

Typical failure modes of an “AI reviewer”:

- Invented scores that nobody can defend
- Eligibility guessed from vibe
- Contradictions (years vs history, jobs narrative vs table) missed
- Unclear ownership treated as “probably fine”

Defensible is built so a reviewer can stand in front of a panel and say: *this rank is this many points, from these bands, on these fields — and here is what the form cannot prove.*

---

## 3. What “the agent” actually is

Three cooperating parts. Only one of them is an LLM.

| Layer | Who | Job | LLM? |
|---|---|---|---|
| **Engine** | TypeScript | Eligibility, contradiction checks, official-band scoring, ranking | No |
| **Explainer** | Gemini (or template fallback) | Headline, why-this-rank, strengths / watchouts | Yes — prose only |
| **Assistant** | Gemini + engine facts | Answer reviewer questions about the open company | Yes — grounded in the dossier |

The contract between layers is `Assessment` / `BatchResult` in `src/types/index.ts`. The UI never scores. The model never writes `points`.

```
Applications (Mongo or 12 fixtures)
        │
        ▼
  assessBatch()  ── eligibility + checks + official grid + rank
        │
        ▼
  explainBatch() ── template briefs, then Gemini polish (cached)
        │
        ▼
  Reviewer console ── shortlist · company dossier · Ask AI
```

---

## 4. Pipeline in detail

### 4.1 Ingest

Each application mirrors the Jotform: company profile, growth table (2022–2026), products, uniqueness, raw materials, management, equipment and consultant requests, job positions, impact / OSH.

Data source:

- MongoDB when `MONGODB_URI` is set and seeded
- Otherwise `fixtures/applications/*.json` (12 companies, including the demo closer **Abyssinia Metalworks**)

Field access is via typed paths (`growth.2024.salesEtb`). A citation that does not resolve on the object cannot render.

### 4.2 Eligibility gate (`src/engine/eligibility.ts`)

Mechanical, from the form’s stated rules.

| Check | Rule | If the form cannot settle it |
|---|---|---|
| `AGE_OVER_2Y` | `yearsInOperation > 2` | Missing years → **unestablished**, not a guess |
| `PRIVATELY_OWNED` | Privately owned SME, not state-owned | **Share company** and **other** stay **unestablished** — the form does not prove there is no state share |

Overall verdict: `excluded` if any check excludes; else `unestablished` if any check is open; else `eligible`.

Excluded applications are **not dropped**. They stay in the batch, ranked last, clearly marked.

This is the product’s first principle: **refuse to guess**.

### 4.3 Contradiction engine (`src/engine/checks/`)

Pure functions. No network. No LLM. Unit-tested against `fixtures/manifest.json`.

**Arithmetic**

| Id | What it catches |
|---|---|
| `OWNERSHIP_SUM` | Women % + men % ≠ 100 |
| `FEMALE_GT_TOTAL` | Female staff > total staff in any year |
| `YOUTH_GT_TOTAL` | Youth staff > total staff in any year |
| `RAW_MATERIAL_RANGE` | Local raw-material % outside 0–100 |

**Cross-section (the ones that win a demo)**

| Id | What it catches |
|---|---|
| `YEARS_VS_HISTORY` | Sales or headcount in a year the company is too young to have operated — **Abyssinia Metalworks** |
| `JOBS_NARRATIVE_VS_TABLE` | Jobs promised in prose ≠ sum of the job table |
| `JOBS_VS_PROJECTION` | New jobs vs 2025→2026 headcount delta |
| `EQUIPMENT_OVER_CAP` | Requested kit above the sequa €12,000 cap (configured FX) |
| `UNIQUENESS_UNSUPPORTED` | “Unique features” claimed with an empty features field (or the reverse) |
| `SOLE_PROP_MULTI_OWNER` | Sole prop with a split that implies multiple owners |

**Form defects**

| Id | What it catches |
|---|---|
| `PRIORITY_AREAS_COUNT` | Section 2.4 is not exactly three areas |
| `CONSULTANT_COUNT` | More than three consultant requests |
| `ORGANOGRAM_MISSING` | Required organogram not uploaded |
| `REQUIRED_FIELD_MISSING` | Required field is null |

**Plausibility flags** (never treated as a hard fail)

| Id | What it flags |
|---|---|
| `SALES_JUMP` | Year-on-year sales beyond a configured multiple |
| `PROJECTION_BREAK` | Forecast breaks from history |

Each finding carries the conflicting field paths and the live values so the UI can show them side by side.

### 4.4 Official scoring grid (`src/config/criteria.ts` + `src/engine/score.ts`)

Source: `docs/Company_Evaluation_grid.pdf`. Weights are not invented.

**100 points.** Criteria 7a (employability) and 7b (investment readiness) are **exclusive**:

- Equipment requested → **7b**
- Otherwise → **7a**

The unused track is omitted, never scored as zero.

Band matching is TypeScript (percentages, headcount, keyword rules for market / green sector). Qualitative bands still cite fields. If the data cannot support a band, the criterion is **`unestablished`**: a reason plus a site-visit question — **not zero points**.

A scored criterion **cannot be constructed without citations**. That is enforced in the type system (`assertRenderableScore`) and at score-construction time.

**Confidence** is `established points available / 100`. It is the share of the grid we could actually score. It is **not** a model saying “I am 80% sure.”

### 4.5 Ranking

1. Excluded last  
2. Then `totalPoints` descending  
3. Then `confidence` descending  

### 4.6 Explainer (`explainBatch`)

After ranks exist, each row gets a reviewer brief:

- Template copy always (offline / no key / quota exhausted)
- Gemini polish when `GEMINI_API_KEY` is set
- Disk cache under `cache/llm/` so a demo does not depend on a live call

Gemini is instructed: *you do not score; facts below are already decided; never invent a number, finding, or citation.*

If quota is exhausted mid-batch, later rows keep templates so `/review` still loads.

---

## 5. The reviewer console

Route: `/review` (session cookie after simulated sign-in).

### Shortlist (left)

- Ranked top to bottom
- Search, rank range, eligibility, 7a/7b, findings, sort, show-limit
- Lead / podium motion on the top ranks
- Click a row to open the company

### Company dossier (right)

Expands with motion. Scrollable. Sections:

1. **Why this rank** — brief, strengths, watchouts  
2. **Findings** — contradictions and defects, field paths and values  
3. **Score grid** — official groups; expand a criterion for band, reasoning, and **tap-a-path → live field value**

Previous / Next walk the ranked batch. Close returns to the list (mobile: list is hidden while a dossier is open).

### Ask AI (Defensible Assistant)

Docked on the selected company. Suggestion chips plus free text.

- Streams an answer grounded in **that company’s** assessment + application packet
- Live Gemini when the key works; otherwise engine-fact answers (rank, findings, eligibility, growth, jobs, unestablished criteria)
- Header shows **live model** vs **engine facts**
- Never invents points. If asked about another company, it says this dossier is the only one open

Auth: any username + demo password `defensible` (shown on `/login`). Session is a signed cookie.

---

## 6. What the LLM is allowed to do

**Allowed**

- Rewrite a brief in operator tone from supplied facts
- Answer “why this rank?”, “what should I watch?”, “walk eligibility”
- Cite field paths that already exist on the packet

**Forbidden**

- Invent or change points, rank, eligibility, or findings
- Fill an unestablished gap with a guess
- Treat `confidence` as model self-report
- Score qualitative criteria as free-form “vibes”

If Gemini is down or over quota, the product still works: templates + local assistant + fixtures.

---

## 7. Demo script (three minutes)

1. **Landing** — Defensible, looping shortlist reel. Enter the console.  
2. **Sign in** — any name, password `defensible`.  
3. **Shortlist** — Alem Leather (or current #1) at the top. Filter / show-limit if you want.  
4. **Open Alem** — expand a high score, tap a citation, show the live field.  
5. **Open Abyssinia Metalworks** — high-ish points, then **`YEARS_VS_HISTORY`**. This is the closer: the form looks strong until the engine catches history the company is too young to have.  
6. **Ask AI** — “Why this rank?” then “What findings should I watch?” Show **live model** if the key is up.

Do not voice-over the finding. Let the row and the dossier do the work.

---

## 8. Architecture (for technical judges)

| Piece | Location |
|---|---|
| Types / citations | `src/types/index.ts`, `src/lib/fields.ts` |
| Official bands | `src/config/criteria.ts` |
| Eligibility | `src/engine/eligibility.ts` |
| Checks | `src/engine/checks/*` |
| Scoring + 7a/7b | `src/engine/score.ts` |
| Batch + rank | `src/engine/assess.ts` |
| Briefs | `src/engine/explain/` |
| Reviewer UI | `src/components/reviewer/` |
| Chat API | `src/app/api/reviewer-chat/route.ts` |
| Chat grounding | `src/lib/reviewerChat.ts` |
| Auth | `src/lib/auth.ts`, `/login` |
| Data | `src/lib/applicationsRepo.ts` |

Stack: Next.js 16 App Router, TypeScript, Tailwind 4, `@google/genai`, optional MongoDB.

---

## 9. What we want a judge to remember

1. **The agent is a pipeline**, not a single prompt.  
2. **Code owns the numbers.** Gemini owns the sentences.  
3. **Unestablished is a first-class output**, not a failure to score.  
4. **Every rendered point cites a field** you can open.  
5. **Abyssinia Metalworks** is the proof: a strong-looking form that the contradiction engine still catches.

That is Defensible: a shortlist you can defend.
