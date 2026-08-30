import type {
  Assessment,
  EligibilityVerdict,
  Severity,
} from "@/types";

export function formatPct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function formatPoints(total: number, max: number): string {
  return `${total}/${max}`;
}

export function trackLabel(assessment: Assessment): string {
  return assessment.jobCreationTrack.id === "investment_readiness"
    ? "7b"
    : "7a";
}

export function trackTitle(assessment: Assessment): string {
  return assessment.jobCreationTrack.id === "investment_readiness"
    ? "7b Investment readiness"
    : "7a Employability";
}

export function eligibilityLabel(verdict: EligibilityVerdict): string {
  switch (verdict) {
    case "eligible":
      return "Eligible";
    case "excluded":
      return "Excluded";
    case "unestablished":
      return "Unestablished";
  }
}

export function severityLabel(severity: Severity): string {
  return severity;
}

export { formatReviewerValue as formatFieldValue } from "./fieldDisplay";

/** Excluded last, then points desc, then confidence desc. */
export function rankAssessments(assessments: Assessment[]): Assessment[] {
  return [...assessments].sort((a, b) => {
    const aEx = a.eligibility.verdict === "excluded" ? 1 : 0;
    const bEx = b.eligibility.verdict === "excluded" ? 1 : 0;
    if (aEx !== bEx) return aEx - bEx;
    return b.totalPoints - a.totalPoints || b.confidence - a.confidence;
  });
}

export function findingTone(severity: Severity): string {
  switch (severity) {
    case "fail":
      return "bg-danger/15 text-danger border-danger/40";
    case "contradiction":
      return "bg-warn/15 text-warn border-warn/40";
    case "defect":
      return "bg-info/15 text-info border-info/40";
    case "flag":
      return "bg-muted/20 text-muted border-border-strong";
  }
}
