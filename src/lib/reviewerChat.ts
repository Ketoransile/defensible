import { criterionById } from "@/config/criteria";
import type { Application, Assessment } from "@/types";
import { isScoredCriterion, isUnestablishedCriterion } from "@/types";
import { explanationFacts } from "@/engine/explain/gemini";

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

export function chatSystemPrompt(ctx: ReviewerChatContext): string {
  return `You are Defensible Assistant, a sequa SME Support Scheme reviewer co-pilot in Ethiopia.

You help a human reviewer interrogate ONE company application. All ranks, points, eligibility, findings, and criterion scores below were decided by deterministic code. You explain and navigate them. You never invent or change numbers.

Rules:
- Answer only from the CONTEXT JSON. If something is missing, say it is not in the form or is unestablished.
- Never invent a score, rank, finding, field value, or citation.
- When referencing a score, name the criterion and points (e.g. "Market overview: 8/10").
- When useful, cite field paths like companyName, growth.2024.salesEtb, jobPositions.
- Be concise, precise, and calm. Use short paragraphs or tight bullets.
- Prefer actionable review guidance over marketing language.
- If asked about another company, say you only have this company's packet open.

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
      `**${name}** is rank **#${a.rank}** with **${a.totalPoints}/${a.maxAvailablePoints}** established points (${Math.round(a.confidence * 100)}% of the grid established).`,
      a.brief.whyThisRank,
      a.neighborAbove
        ? `Company immediately above: ${a.neighborAbove}.`
        : "This is the top-ranked application in the current batch.",
    ].join("\n\n");
  }

  if (/finding|contradict|conflict|flag|watch|risk|years.?vs.?history/.test(q)) {
    if (a.findings.length === 0) {
      return `No contradiction or defect findings on **${name}**. Eligibility is **${a.eligibility}**.`;
    }
    const lines = a.findings.map(
      (f) =>
        `• **${f.checkId}** (${f.severity}): ${f.title}\n  ${f.explanation}${
          f.fields?.length
            ? `\n  Fields: ${f.fields.join(", ")}`
            : ""
        }`,
    );
    return [`**${a.findings.length} finding(s)** on **${name}**:`, ...lines].join(
      "\n\n",
    );
  }

  if (/unestablish|missing|open question|cannot (score|prove)/.test(q)) {
    if (a.unestablishedCount === 0) {
      return `Every scored criterion on **${name}** is established. Open questions: ${
        a.openQuestions.length
          ? a.openQuestions.join("; ")
          : "none listed."
      }`;
    }
    return [
      `**${a.unestablishedCount}** criterion/criteria remain unestablished on **${name}**:`,
      ...a.unestablishedLabels.map((l) => `• ${l}`),
      a.openQuestions.length
        ? `\nSite-visit prompts:\n${a.openQuestions.map((o) => `• ${o}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (/eligib|gate|excluded|ownership|age|year/.test(q)) {
    const checks = a.eligibilityChecks
      .map((ch) => `• **${ch.id}**: ${ch.verdict}. ${ch.explanation}`)
      .join("\n");
    return [
      `Eligibility for **${name}**: **${a.eligibility}**.`,
      `Years in operation (form): **${c.yearsInOperation ?? "null"}**. Org form: **${c.businessOrgForm ?? "null"}**.`,
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
      `Job-creation track for **${name}**: **${a.track}** (exclusive 7a/7b).`,
      c.jobCreationNarrative
        ? `Narrative: ${c.jobCreationNarrative}`
        : "No job-creation narrative on the form.",
      jobs || "No job positions listed.",
      equip ? `Equipment requests:\n${equip}` : "No equipment requests.",
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
    return `Growth table for **${name}**:\n\n${rows || "No growth rows present."}`;
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
      `**${name}** totals **${a.totalPoints}/${a.maxAvailablePoints}** (${Math.round(a.confidence * 100)}% established).`,
      top || "No scored criteria.",
      a.brief.justification,
    ].join("\n\n");
  }

  // Default dossier
  return [
    `**${name}** — rank #${a.rank}, ${a.totalPoints}/${a.maxAvailablePoints} pts, eligibility **${a.eligibility}**, track **${a.track}**.`,
    a.brief.headline,
    a.findings.length
      ? `${a.findings.length} finding(s): ${a.findings.map((f) => f.checkId).join(", ")}.`
      : "No findings.",
    "Ask about rank, findings, eligibility, growth, jobs/track, or unestablished criteria for a deeper cut.",
  ].join("\n\n");
}
