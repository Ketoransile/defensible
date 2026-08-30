import { describe, expect, it } from "vitest";
import { assessBatch } from "@/engine/assess";
import { loadApplication } from "@/lib/loadFixtures";
import {
  buildReviewerChatContext,
  chatSystemPrompt,
  isCutOffReply,
  localAssistantReply,
  wrapReviewerTurn,
} from "@/lib/reviewerChat";

function firstContext() {
  const batch = assessBatch();
  const assessment = batch.assessments[0];
  if (!assessment) throw new Error("expected a scored assessment");
  const application = loadApplication(assessment.applicationId);
  return buildReviewerChatContext(assessment, application, null);
}

describe("reviewer chat prompt", () => {
  it("briefs the reviewer and never cites a fake 8/10 market band", () => {
    const prompt = chatSystemPrompt(firstContext());
    expect(prompt).not.toContain("8/10");
    expect(prompt).toContain("Market overview: 5/5");
    expect(prompt).toContain("Speak directly to the reviewer");
    expect(prompt).toContain("Unestablished is a gap");
    expect(prompt).toContain("Never write camelCase");
  });

  it("wraps the latest turn as a reviewer brief", () => {
    expect(wrapReviewerTurn("Why this rank?")).toContain("Why this rank?");
    expect(wrapReviewerTurn("Why this rank?")).toContain("Plain English only");
  });

  it("detects a reply that died mid-sentence", () => {
    expect(
      isCutOffReply(
        "This file is ranked 12th and excluded from the scheme because NewBloom",
      ),
    ).toBe(true);
    expect(
      isCutOffReply(
        "You have this file at rank #12 because it is excluded on eligibility.",
      ),
    ).toBe(false);
    expect(isCutOffReply("Watch the age gate.\nCheck: years in operation")).toBe(
      false,
    );
  });

  it("answers the reviewer in second person when Gemini is offline", () => {
    const ctx = firstContext();
    expect(localAssistantReply("Why this rank?", ctx)).toMatch(/^You have /);
    expect(localAssistantReply("What findings should I watch?", ctx)).toMatch(
      /this file/,
    );
  });

  it("walks eligibility without schema names", () => {
    const ctx = firstContext();
    const reply = localAssistantReply("Walk me through eligibility", ctx);
    expect(reply).toMatch(/eligible/i);
    expect(reply).not.toMatch(/yearsInOperation|businessOrgForm|`/);
    expect(reply).toMatch(/Years in operation/);
    expect(reply).toMatch(/Private limited company|legal form/i);
  });
});
