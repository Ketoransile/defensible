import { criterionById } from "@/config/criteria";
import {
  checkLabel,
  fieldLabel,
  formatReviewerValue,
} from "@/components/reviewer/fieldDisplay";
import type { Application, Assessment, FieldPath } from "@/types";
import { isScoredCriterion, isUnestablishedCriterion } from "@/types";
import { explanationFacts } from "@/engine/explain/gemini";

const ELIGIBILITY_LABEL: Record<string, string> = {
  AGE_OVER_2Y: "Years in operation",
  PRIVATELY_OWNED: "Private ownership",
};

function humanFieldList(paths: string[] | undefined): string {
  if (!paths?.length) return "";
  return paths.map((p) => fieldLabel(p as FieldPath)).join(", ");
}

/**
 * Compact, citation-ready packet for the reviewer chat assistant.
 * Scores and findings come from the engine — never invented here.
 */
export function buildReviewerChatContext(
  assessment: Assessment,
  application: Application,
  neighborAbove: string | null,
) {
  const facts = explanationFacts(assessment, neighborAbove);

  const scored = assessment.criteria.filter(isScoredCriterion);
  const unestablished = assessment.criteria.filter(isUnestablishedCriterion);

  return {
    company: {
      id: application.id,
      name: application.companyName,
      address: application.address,
      cityRegion: application.cityRegion,
      businessOrgForm: application.businessOrgForm,
      yearsInOperation: application.yearsInOperation,
      businessType: application.businessType,
      ownershipWomenPct: application.ownershipWomenPct,
      ownershipMenPct: application.ownershipMenPct,
      companyOverview: application.companyOverview,
      motivation: application.motivation,
      businessGoals: application.businessGoals,
      marketOverview: application.marketOverview,
      uniqueness: application.uniqueness,
      uniqueFeatures: application.uniqueFeatures,
      localRawMaterialPct: application.localRawMaterialPct,
      keyRawMaterials: application.keyRawMaterials,
      products: application.products,
      managementTeam: application.managementTeam,
      equipmentRequests: application.equipmentRequests,
      consultantRequests: application.consultantRequests,
      expectedResults: application.expectedResults,
      jobCreationNarrative: application.jobCreationNarrative,
      jobPositions: application.jobPositions,
      growth: application.growth,
      socialEnvironmentalImpact: application.socialEnvironmentalImpact,
      oshCommitment: application.oshCommitment,
    },
    assessment: {
      rank: facts.rank,
      eligibility: facts.eligibility,
      eligibilityChecks: facts.eligibilityChecks,
      totalPoints: facts.totalPoints,
      maxAvailablePoints: facts.maxAvailablePoints,
      confidence: facts.confidence,
      track: facts.track,
      findings: facts.findings,
      criteria: facts.criteria,
      neighborAbove: facts.neighborAbove,
      brief: assessment.brief,
      openQuestions: assessment.openQuestions,
      scoredCount: scored.length,
      unestablishedCount: unestablished.length,
      unestablishedLabels: unestablished.map(
        (c) => criterionById(c.criterionId).label,
      ),
    },
  };
}

export type ReviewerChatContext = ReturnType<typeof buildReviewerChatContext>;

/** True when the model stopped mid-clause (MAX_TOKENS / thinking ate the budget). */
export function isCutOffReply(text: string): boolean {
  const tail = text.trim();
  if (!tail) return false;
  const lastLine = tail.split("\n").filter(Boolean).at(-1) ?? "";
  if (/^Check:\s+\S/.test(lastLine)) return false;
  if (/[.!?…]"?$/.test(tail)) return false;
  return /[A-Za-z0-9,;]$/.test(tail);
}

/** Reinforces voice on the latest user turn so history does not dilute the brief. */
export function wrapReviewerTurn(question: string): string {
  return `Brief me as the reviewer. Verdict first, then at most four bullets. Plain English only — no schema names, no backticks, no camelCase.\n\n${question.trim()}`;
}

export function chatSystemPrompt(ctx: ReviewerChatContext): string {
  return `You sit with the sequa SME Support Scheme reviewer. This application is already scored by deterministic code. You do not score, re-rank, or invent numbers. You brief the reviewer on THIS file only.

Audience
- Speak directly to the reviewer: "you", "this file".
- Never address the applicant. Never pitch the company. Never sound like marketing.
- Do not open with hello, sure, of course, great question, or a recap of their question.
- Do not close with "let me know", "happy to help", or an offer to do more.

Facts
- CONTEXT JSON is the only source. Ranks, points, eligibility, findings, and criterion scores were decided by the engine.
- If a value is missing or a criterion is unestablished, say so. Unestablished is a gap — never treat it as zero.
- Never invent a score, rank, finding, field value, or citation.
- Quote official bands only, with the real maximum from CONTEXT (e.g. "Market overview: 5/5"). Never invent a denominator.

Wording — mandatory
- CONTEXT keys are internal. Never print them.
- Never write camelCase, snake_case enums, backticks, or parenthetical schema names such as yearsInOperation, businessOrgForm, jobPositions, growth.2022.salesEtb, private_limited_company.
- Say the same facts in ordinary English: years in operation, legal form, private limited company, 2022 sales, new jobs.

Shape every answer
1. One verdict sentence — what you should take from this.
2. At most four short bullets of engine facts.
3. Stop. No "Check:" line. No field-path footnotes.

Length: keep it under ~120 words. Prefer spoken professional English over essays.
Other companies: you only have this packet. Mention neighborAbove only if it explains this rank.

CONTEXT:
${JSON.stringify(ctx, null, 2)}`;
}

/**
 * Offline / no-key answers grounded in the same context packet.
 */
export function localAssistantReply(
  question: string,
  ctx: ReviewerChatContext,
): string {
  const q = question.toLowerCase();
  const a = ctx.assessment;
  const c = ctx.company;
  const name = c.name ?? c.id;

  if (/rank|why (this|are they)|position|place/.test(q)) {
    return [
      `You have **${name}** at rank **#${a.rank}** — **${a.totalPoints}/${a.maxAvailablePoints}** established (${Math.round(a.confidence * 100)}% of the grid filled).`,
      a.brief.whyThisRank,
      a.neighborAbove
        ? `The file immediately above is ${a.neighborAbove}.`
        : "This is the top of the current batch.",
    ].join("\n\n");
  }

  if (/finding|contradict|conflict|flag|watch|risk|years.?vs.?history/.test(q)) {
    if (a.findings.length === 0) {
      return `You have no contradiction or defect findings on this file. Eligibility is **${a.eligibility}**.`;
    }
    const lines = a.findings.map(
      (f) =>
        `• **${checkLabel(f.checkId)}** (${f.severity}): ${f.title}\n  ${f.explanation}${
          f.fields?.length ? `\n  Look at ${humanFieldList(f.fields)}.` : ""
        }`,
    );
    return [
      `Watch these before you sign off — **${a.findings.length}** finding(s) on this file:`,
      ...lines,
    ].join("\n\n");
  }

  if (/unestablish|missing|open question|cannot (score|prove)/.test(q)) {
    if (a.unestablishedCount === 0) {
      return `Every scored criterion on this file is established. Open questions: ${
        a.openQuestions.length
          ? a.openQuestions.join("; ")
          : "none listed."
      }`;
    }
    return [
      `You still have **${a.unestablishedCount}** unestablished criterion/criteria on this file:`,
      ...a.unestablishedLabels.map((l) => `• ${l}`),
      a.openQuestions.length
        ? `Check (site visit):\n${a.openQuestions.map((o) => `• ${o}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (/eligib|gate|excluded|ownership|age|year/.test(q)) {
    const checks = a.eligibilityChecks
      .map((ch) => {
        const label = ELIGIBILITY_LABEL[ch.id] ?? checkLabel(ch.id);
        return `• **${label}**: ${ch.verdict}. ${ch.explanation}`;
      })
      .join("\n");
    return [
      `Eligibility on this file is **${a.eligibility}**.`,
      `Years in operation: **${c.yearsInOperation ?? "not filed"}**. Legal form: **${formatReviewerValue(c.businessOrgForm)}**.`,
      checks,
    ].join("\n\n");
  }

  if (/job|employ|7a|7b|track|equipment|invest/.test(q)) {
    const jobs = (c.jobPositions ?? [])
      .filter((j) => j.position || j.newJobs != null)
      .map((j) => `• ${j.position ?? "Role"}: ${j.newJobs ?? "?"} new jobs`)
      .join("\n");
    const equip = (c.equipmentRequests ?? [])
      .filter((e) => e.description)
      .map(
        (e) =>
          `• ${e.description} ×${e.quantity ?? "?"} (${e.estimatedTotalPriceEtb ?? "?"} ETB)`,
      )
      .join("\n");
    return [
      `You are on the **${a.track}** job-creation track (7a and 7b stay exclusive).`,
      c.jobCreationNarrative
        ? c.jobCreationNarrative
        : "No job-creation narrative on the form.",
      jobs || "No job positions listed.",
      equip ? `Equipment on the form:\n${equip}` : "No equipment requests.",
    ].join("\n\n");
  }

  if (/growth|sales|revenue|employee|financial/.test(q)) {
    const years = ["2022", "2023", "2024", "2025_proj", "2026_proj"] as const;
    const rows = years
      .map((y) => {
        const g = c.growth?.[y];
        if (!g) return null;
        return `• **${y}**: sales ${g.salesEtb ?? "—"} ETB · staff ${g.totalEmployees ?? "—"} (♀ ${g.femaleEmployees ?? "—"}, youth ${g.youthEmployees ?? "—"})`;
      })
      .filter(Boolean)
      .join("\n");
    return `Growth as filed on this form:\n\n${rows || "No growth rows present."}`;
  }

  if (/score|grid|criteria|points|band/.test(q)) {
    const top = a.criteria
      .filter((cr) => cr.status === "scored")
      .slice(0, 8)
      .map((cr) => {
        const pts =
          "points" in cr && typeof cr.points === "number"
            ? `${cr.points}/${cr.maxPoints}`
            : `—/${cr.maxPoints}`;
        return `• ${cr.sn} ${cr.label}: ${pts}`;
      })
      .join("\n");
    return [
      `This file totals **${a.totalPoints}/${a.maxAvailablePoints}** (${Math.round(a.confidence * 100)}% established).`,
      top || "No scored criteria.",
      a.brief.justification,
    ].join("\n\n");
  }

  return [
    `You have **${name}** — rank #${a.rank}, ${a.totalPoints}/${a.maxAvailablePoints} pts, eligibility **${a.eligibility}**, track **${a.track}**.`,
    a.brief.headline,
    a.findings.length
      ? `Findings to watch: ${a.findings.map((f) => f.checkId).join(", ")}.`
      : "No findings on this file.",
  ].join("\n\n");
}
