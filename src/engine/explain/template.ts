import { criterionById } from "@/config/criteria";
import {
  isScoredCriterion,
  isUnestablishedCriterion,
  type Assessment,
  type ReviewerBrief,
} from "@/types";

function nameOf(a: Assessment): string {
  return a.companyName ?? a.applicationId;
}

function pointsLine(a: Assessment): string {
  const pct = Math.round(a.confidence * 100);
  return `${a.totalPoints} of ${a.maxAvailablePoints} established points (${pct}% of the grid established)`;
}

function materialFindings(a: Assessment) {
  return a.findings.filter((f) => f.severity !== "flag");
}

export function strengthsFrom(a: Assessment): string[] {
  return a.criteria
    .filter(isScoredCriterion)
    .filter((c) => c.maxPoints > 0 && c.points / c.maxPoints >= 0.7)
    .sort((x, y) => y.points / y.maxPoints - x.points / x.maxPoints)
    .slice(0, 3)
    .map((c) => {
      const def = criterionById(c.criterionId);
      return `${def.sn} ${def.label}: ${c.points}/${c.maxPoints}. ${c.reasoning}`;
    });
}

export function watchoutsFrom(a: Assessment): string[] {
  const fromFindings = materialFindings(a).map((f) => `${f.title} — ${f.explanation}`);
  const fromUnest = a.criteria.filter(isUnestablishedCriterion).map((c) => {
    const def = criterionById(c.criterionId);
    return `${def.label} unestablished: ${c.reason}`;
  });
  const fromElig = a.eligibility.checks
    .filter((c) => c.verdict !== "eligible")
    .map((c) => `${c.checkId}: ${c.explanation}`);
  const flags = a.findings
    .filter((f) => f.severity === "flag")
    .map((f) => `${f.title} — ${f.explanation}`);
  return [...fromElig, ...fromFindings, ...fromUnest, ...flags].slice(0, 6);
}

export function templateBrief(
  a: Assessment,
  ctx: { size: number; leader: Assessment; above: Assessment | null },
): ReviewerBrief {
  const name = nameOf(a);
  const findings = materialFindings(a);
  const closer = findings.find((f) => f.checkId === "YEARS_VS_HISTORY");
  const strengths = strengthsFrom(a);
  const watchouts = watchoutsFrom(a);
  const track =
    a.jobCreationTrack.id === "investment_readiness"
      ? "investment-readiness (7b)"
      : "employability (7a)";

  let headline: string;
  let whyThisRank: string;

  if (a.eligibility.verdict === "excluded") {
    const age = a.eligibility.checks.find((c) => c.checkId === "AGE_OVER_2Y");
    headline = `Excluded · ${age?.explanation ?? "failed the two-year rule"}`;
    whyThisRank = `${name} is ranked last because it is excluded on eligibility, not because of a weak grid score. ${age?.explanation ?? ""}`.trim();
  } else if (a.eligibility.verdict === "unestablished") {
    const priv = a.eligibility.checks.find((c) => c.checkId === "PRIVATELY_OWNED");
    headline = `Ownership unestablished · ${pointsLine(a)}`;
    whyThisRank = `${name} sits at rank ${a.rank} of ${ctx.size} with ${pointsLine(a)}, but privately-owned status is not established. ${priv?.explanation ?? ""} The form does not let us clear a share company.`;
  } else if (closer) {
    headline = `Strong on the grid, then the history lands · ${a.totalPoints} pts`;
    whyThisRank = `${name} would compete near the top (${pointsLine(a)}), but ${closer.explanation} That finding is why it does not lead the shortlist.`;
  } else if (a.rank === 1) {
    headline = `Shortlist lead · ${pointsLine(a)}`;
    whyThisRank = `${name} ranks 1 of ${ctx.size}: highest established points, eligible, ${findings.length === 0 ? "no material findings" : `${findings.length} material finding(s)`}, scored on the ${track} track.`;
  } else {
    const gap = ctx.above ? ctx.above.totalPoints - a.totalPoints : 0;
    const vs = ctx.above
      ? ` ${gap === 0 ? `Tied on points with ${nameOf(ctx.above)}; confidence and findings separate them.` : `${gap} points behind ${nameOf(ctx.above)} (${ctx.above.totalPoints}).`}`
      : "";
    headline =
      findings.length > 0
        ? `${findings[0].title} · ${a.totalPoints} pts`
        : `${pointsLine(a)}`;
    whyThisRank = `${name} is rank ${a.rank} of ${ctx.size} with ${pointsLine(a)} on the ${track} track.${vs}`;
  }

  const strengthText =
    strengths.length > 0
      ? `Strengths: ${strengths.map((s) => s.split(".")[0]).join("; ")}.`
      : "Few criteria reached a high band.";
  const riskText =
    watchouts.length > 0
      ? `Watch: ${watchouts[0]}`
      : "No material findings on the file as submitted.";

  const justification = [
    `${name} scores ${pointsLine(a)} on the official sequa grid, using the ${track} track: ${a.jobCreationTrack.reason}`,
    whyThisRank,
    strengthText,
    riskText,
    a.openQuestions[0]
      ? `Site visit: ${a.openQuestions[0]}`
      : "No open eligibility question beyond the scored file.",
  ].join(" ");

  return {
    headline: headline.slice(0, 180),
    whyThisRank,
    justification,
    strengths,
    watchouts,
    source: "template",
  };
}

export function attachTemplateBriefs(assessments: Assessment[]): Assessment[] {
  const leader = assessments[0];
  const size = assessments.length;
  return assessments.map((a, i) => {
    const ranked: Assessment = { ...a, rank: i + 1 };
    const brief = templateBrief(ranked, {
      size,
      leader,
      above: i > 0 ? assessments[i - 1] : null,
    });
    return {
      ...ranked,
      brief,
      justification: brief.justification,
    };
  });
}
