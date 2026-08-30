import { describe, expect, it } from "vitest";
import { assessBatch } from "@/engine/assess";
import { explainBatch } from "@/engine/explain";
import { isGeminiQuotaError } from "@/engine/explain/gemini";

describe("reviewer brief", () => {
  it("puts a rank, headline, and whyThisRank on every row", () => {
    const batch = assessBatch();
    expect(batch.assessments[0].rank).toBe(1);
    expect(batch.assessments[0].brief.headline.length).toBeGreaterThan(10);
    expect(batch.assessments[0].brief.whyThisRank).toMatch(/ranks 1 of/i);
    expect(batch.assessments[0].brief.source).toBe("template");

    const closer = batch.assessments.find(
      (a) => a.applicationId === "05-abyssinia-metal",
    );
    expect(closer?.brief.headline).toMatch(/history/i);
    expect(closer?.brief.whyThisRank).toMatch(/years in operation/i);

    const excluded = batch.assessments.filter(
      (a) => a.eligibility.verdict === "excluded",
    );
    expect(excluded.at(-1)?.brief.headline).toMatch(/excluded/i);
  });

  it("treats Gemini 429 as a quota miss, not a crash", () => {
    expect(
      isGeminiQuotaError(
        new Error(
          '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","message":"You exceeded your current quota"}}',
        ),
      ),
    ).toBe(true);
    expect(isGeminiQuotaError(new Error("network down"))).toBe(false);
  });

  it("keeps template copy when Gemini is not configured", async () => {
    const prev = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const explained = await explainBatch(assessBatch());
    expect(explained.assessments.every((a) => a.brief.headline.length > 0)).toBe(
      true,
    );
    if (prev) process.env.GEMINI_API_KEY = prev;
  });
});
