import { validateCitations } from "@/lib/fields";
import type { Application, BatchResult } from "@/types";

export interface ReviewerIntegritySummary {
  applications: number;
  eligibilityChecks: number;
  criteriaEvaluated: number;
  findings: number;
  citations: number;
  validCitations: number;
  invalidCitations: number;
  aiScoredPoints: 0;
}

/**
 * Derives the console's integrity claims from the rendered batch itself.
 * "Valid" means the cited path resolves against the selected application.
 */
export function summarizeReviewerIntegrity(
  batch: BatchResult,
  applications: Record<string, Application>,
): ReviewerIntegritySummary {
  let eligibilityChecks = 0;
  let criteriaEvaluated = 0;
  let findings = 0;
  let citations = 0;
  let validCitations = 0;
  let invalidCitations = 0;

  for (const assessment of batch.assessments) {
    eligibilityChecks += assessment.eligibility.checks.length;
    findings += assessment.findings.length;

    const application = applications[assessment.applicationId];
    for (const criterion of assessment.criteria) {
      criteriaEvaluated += 1;
      citations += criterion.citations.length;

      if (!application) {
        invalidCitations += criterion.citations.length;
        continue;
      }

      const result = validateCitations(application, criterion.citations);
      validCitations += result.valid.length;
      invalidCitations += result.invalid.length;
    }
  }

  return {
    applications: batch.assessments.length,
    eligibilityChecks,
    criteriaEvaluated,
    findings,
    citations,
    validCitations,
    invalidCitations,
    aiScoredPoints: 0,
  };
}
