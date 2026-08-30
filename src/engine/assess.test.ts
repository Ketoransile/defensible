import { describe, expect, it } from "vitest";
import { assessBatch } from "@/engine/assess";
import { selectJobCreationTrack } from "@/engine/score";
import { loadApplication } from "@/lib/loadFixtures";

describe("assessBatch", () => {
  it("returns twelve assessments and ranks excluded last", () => {
    const batch = assessBatch();
    expect(batch.assessments).toHaveLength(12);
    const excluded = batch.assessments.filter(
      (a) => a.eligibility.verdict === "excluded",
    );
    expect(excluded.length).toBeGreaterThan(0);
    const last = batch.assessments.slice(-excluded.length);
    expect(last.every((a) => a.eligibility.verdict === "excluded")).toBe(true);

    const active = batch.assessments.filter(
      (a) => a.eligibility.verdict !== "excluded",
    );
    const points = active.map((a) => a.totalPoints);
    expect(points).toEqual([...points].sort((a, b) => b - a));
    expect(new Set(points.slice(0, 5)).size).toBe(5);

    for (const a of batch.assessments) {
      expect(a.criteria).toHaveLength(12);
      expect(a.jobCreationTrack.criterionId).toBeTruthy();
      expect(a.rank).toBeGreaterThan(0);
      expect(a.brief.headline.length).toBeGreaterThan(0);
    }
  });

  it("uses 7b for Alem (equipment) and still assesses the sparse applicant", () => {
    const alem = loadApplication("01-alem-leather");
    expect(selectJobCreationTrack(alem).id).toBe("investment_readiness");
    const batch = assessBatch();
    expect(batch.assessments.some((a) => a.applicationId === "11-sparse-workshop")).toBe(
      true,
    );
  });
});
