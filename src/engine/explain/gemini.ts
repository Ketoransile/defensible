import { GoogleGenAI } from "@google/genai";
import { criterionById } from "@/config/criteria";
import type { Assessment, ReviewerBrief } from "@/types";
import { isScoredCriterion, isUnestablishedCriterion } from "@/types";
import { factsHash, readCachedBrief, writeCachedBrief } from "./cache";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

export function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

export function explanationFacts(a: Assessment, neighbor: string | null) {
  return {
    rank: a.rank,
    companyName: a.companyName,
    eligibility: a.eligibility.verdict,
    eligibilityChecks: a.eligibility.checks.map((c) => ({
      id: c.checkId,
      verdict: c.verdict,
      explanation: c.explanation,
    })),
    totalPoints: a.totalPoints,
    maxAvailablePoints: a.maxAvailablePoints,
    confidence: a.confidence,
    track: a.jobCreationTrack,
    findings: a.findings.map((f) => ({
      checkId: f.checkId,
      severity: f.severity,
      title: f.title,
      explanation: f.explanation,
      fields: f.fields,
      values: f.values,
    })),
    criteria: a.criteria.map((c) => {
      const def = criterionById(c.criterionId);
      if (isScoredCriterion(c)) {
        return {
          sn: def.sn,
          label: def.label,
          status: c.status,
          points: c.points,
          maxPoints: c.maxPoints,
          reasoning: c.reasoning,
          citations: c.citations,
        };
      }
      return {
        sn: def.sn,
        label: def.label,
        status: c.status,
        maxPoints: c.maxPoints,
        reason: isUnestablishedCriterion(c) ? c.reason : "",
        openQuestion: isUnestablishedCriterion(c) ? c.openQuestion : "",
        citations: c.citations,
      };
    }),
    neighborAbove: neighbor,
    templateHeadline: a.brief.headline,
    templateWhy: a.brief.whyThisRank,
  };
}

function parseBrief(raw: string): ReviewerBrief | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<ReviewerBrief>;
    if (!parsed.headline || !parsed.whyThisRank || !parsed.justification) return null;
    return {
      headline: String(parsed.headline).slice(0, 180),
      whyThisRank: String(parsed.whyThisRank),
      justification: String(parsed.justification),
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.map(String).slice(0, 5)
        : [],
      watchouts: Array.isArray(parsed.watchouts)
        ? parsed.watchouts.map(String).slice(0, 6)
        : [],
      source: "gemini",
    };
  } catch {
    return null;
  }
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function isGeminiQuotaError(err: unknown): boolean {
  const text = errorText(err);
  return (
    text.includes("RESOURCE_EXHAUSTED") ||
    text.includes('"code":429') ||
    text.includes("exceeded your current quota") ||
    text.includes("Too Many Requests")
  );
}

export interface GeminiBriefResult {
  brief: ReviewerBrief | null;
  /** Live Gemini is out of quota — skip further API calls this request. */
  exhausted: boolean;
}

export async function geminiBrief(
  a: Assessment,
  neighbor: string | null,
  options: { skipLive?: boolean } = {},
): Promise<GeminiBriefResult> {
  const facts = explanationFacts(a, neighbor);
  const hash = factsHash(facts);
  const cached = readCachedBrief(a.applicationId, hash);
  if (cached) return { brief: cached, exhausted: false };
  if (options.skipLive || !geminiApiKey()) return { brief: null, exhausted: false };

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey() });
    const prompt = `You are a sequa SME Support Scheme reviewer in Ethiopia. You write for the evaluation dashboard.

You do NOT score. Points, eligibility, findings, and citations below are already decided by code. You only write prose.

Rules:
- Never invent a number, field, finding, or citation.
- Never change a score or rank.
- If something is unestablished, say so. Do not fill the gap.
- Tone: precise, calm, operator. No hype, no "exciting opportunity".
- headline: max 160 characters, for the ranked table.
- whyThisRank: 1–2 sentences, comparative (why this rank in the batch).
- justification: one paragraph, 3–5 sentences, for the expand panel.
- strengths / watchouts: short bullets grounded in the supplied criteria and findings.

Return JSON only:
{
  "headline": string,
  "whyThisRank": string,
  "justification": string,
  "strengths": string[],
  "watchouts": string[]
}

FACTS:
${JSON.stringify(facts, null, 2)}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return { brief: null, exhausted: false };
    const brief = parseBrief(text);
    if (!brief) return { brief: null, exhausted: false };
    if (brief.strengths.length === 0) brief.strengths = a.brief.strengths;
    if (brief.watchouts.length === 0) brief.watchouts = a.brief.watchouts;
    writeCachedBrief(a.applicationId, hash, brief);
    return { brief, exhausted: false };
  } catch (err) {
    if (isGeminiQuotaError(err)) {
      return { brief: null, exhausted: true };
    }
    return { brief: null, exhausted: false };
  }
}
