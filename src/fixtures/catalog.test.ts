import { describe, expect, it } from "vitest";
import { CRITERIA, DEFAULT_WEIGHTS, totalWeight } from "@/config/criteria";
import { loadApplications, loadManifest, MANIFEST } from "@/lib/loadFixtures";

describe("scoring grid", () => {
  it("sums to 100 points", () => {
    expect(totalWeight(DEFAULT_WEIGHTS)).toBe(100);
    expect(CRITERIA).toHaveLength(9);
  });
});

describe("fixtures", () => {
  it("writes twelve applications matching the manifest", () => {
    const apps = loadApplications();
    const manifest = loadManifest();
    expect(apps).toHaveLength(12);
    expect(manifest.fixtures).toHaveLength(12);
    expect(apps.map((a) => a.id)).toEqual(MANIFEST.map((m) => m.id));
  });

  it("marks fixture 5 as the demo closer", () => {
    const closer = MANIFEST.find((m) => m.demoCloser);
    expect(closer?.id).toBe("05-abyssinia-metal");
    expect(closer?.expectedChecks).toContain("YEARS_VS_HISTORY");
  });
});
