import { describe, expect, it } from "vitest";
import { CRITERIA, GRID_MAX_POINTS, activeWeightSum } from "@/config/criteria";
import { loadApplications, loadManifest, MANIFEST } from "@/lib/loadFixtures";

describe("scoring grid", () => {
  it("live grid is 100 after choosing 7a or 7b", () => {
    expect(CRITERIA).toHaveLength(13);
    expect(GRID_MAX_POINTS).toBe(100);
    expect(activeWeightSum("job_creation_employability")).toBe(100);
    expect(activeWeightSum("job_creation_investment")).toBe(100);
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
