import { describe, expect, it } from "vitest";
import { runChecks } from "@/engine/checks";
import { evaluateEligibility } from "@/engine/eligibility";
import { MANIFEST } from "@/fixtures/catalog";
import { loadApplication } from "@/lib/loadFixtures";

function triggeredIds(id: string): string[] {
  const app = loadApplication(id);
  const findingIds = runChecks(app).map((f) => f.checkId);
  const eligibilityIds = evaluateEligibility(app)
    .checks.filter((c) => c.verdict !== "eligible")
    .map((c) => c.checkId);
  return [...new Set([...findingIds, ...eligibilityIds])];
}

describe("manifest oracle", () => {
  it("fires every expected check, and the clean applicant is clean", () => {
    for (const meta of MANIFEST) {
      const ids = triggeredIds(meta.id);
      for (const checkId of meta.expectedChecks) {
        expect(ids, `${meta.id} missing ${checkId}`).toContain(checkId);
      }
    }

    const alem = triggeredIds("01-alem-leather");
    expect(alem).toEqual([]);
    expect(evaluateEligibility(loadApplication("01-alem-leather")).verdict).toBe(
      "eligible",
    );
  });

  it("uses YEARS_VS_HISTORY as the demo closer on Abyssinia Metalworks", () => {
    const closer = MANIFEST.find((m) => m.demoCloser);
    expect(closer?.id).toBe("05-abyssinia-metal");
    const app = loadApplication("05-abyssinia-metal");
    const years = runChecks(app).filter((f) => f.checkId === "YEARS_VS_HISTORY");
    expect(years.length).toBeGreaterThan(0);
    expect(years[0].values.yearsInOperation).toBe(3);
    expect(years[0].fields).toContain("yearsInOperation");
    expect(years[0].values.reportedYear).toBe("2022");
  });
});
