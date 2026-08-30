import { describe, expect, it } from "vitest";
import { assessBatch } from "@/engine/assess";
import { loadApplications } from "@/lib/loadFixtures";
import { summarizeReviewerIntegrity } from "@/lib/reviewerIntegrity";

describe("reviewer integrity summary", () => {
  it("derives the demo claims from the assessed batch", () => {
    const applications = loadApplications();
    const batch = assessBatch(applications);
    const byId = Object.fromEntries(
      applications.map((application) => [application.id, application]),
    );

    const summary = summarizeReviewerIntegrity(batch, byId);

    expect(summary.applications).toBe(12);
    expect(summary.eligibilityChecks).toBe(24);
    expect(summary.criteriaEvaluated).toBe(144);
    expect(summary.findings).toBeGreaterThan(0);
    expect(summary.citations).toBeGreaterThan(0);
    expect(summary.validCitations).toBe(summary.citations);
    expect(summary.invalidCitations).toBe(0);
    expect(summary.aiScoredPoints).toBe(0);
  });

  it("does not call unresolved citations valid when an application is absent", () => {
    const applications = loadApplications();
    const batch = assessBatch(applications);
    const first = batch.assessments[0];
    if (!first) throw new Error("expected an assessment");

    const isolated = {
      ...batch,
      assessments: [first],
    };
    const summary = summarizeReviewerIntegrity(isolated, {});

    expect(summary.validCitations).toBe(0);
    expect(summary.invalidCitations).toBe(summary.citations);
  });
});
