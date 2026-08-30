import { describe, expect, it } from "vitest";
import {
  CRITERIA,
  GRID_MAX_POINTS,
  activeCriteria,
  activeWeightSum,
} from "@/config/criteria";
import {
  scoreApplication,
  selectJobCreationTrack,
} from "@/engine/score";
import { makeApplication } from "@/fixtures/factory";
import { citationResolves } from "@/lib/fields";
import { assertRenderableScore, isScoredCriterion } from "@/types";

describe("official grid", () => {
  it("has 13 published leaves; a live application uses 12 (one of 7a/7b) totaling 100", () => {
    expect(CRITERIA).toHaveLength(13);
    expect(GRID_MAX_POINTS).toBe(100);
    expect(activeWeightSum("job_creation_employability")).toBe(100);
    expect(activeWeightSum("job_creation_investment")).toBe(100);
    expect(activeCriteria("job_creation_investment")).toHaveLength(12);
  });
});

describe("7a vs 7b track", () => {
  it("picks 7b when machinery is requested and does not score 7a", () => {
    const app = makeApplication({
      id: "with-equipment",
      companyName: "Alem Leather Works PLC",
    });
    const track = selectJobCreationTrack(app);
    const scores = scoreApplication(app);
    const ids = scores.map((s) => s.criterionId);

    expect(track.id).toBe("investment_readiness");
    expect(ids).toContain("job_creation_investment");
    expect(ids).not.toContain("job_creation_employability");
    expect(scores).toHaveLength(12);

    const jobs = scores.find((s) => s.criterionId === "job_creation_investment");
    expect(jobs && isScoredCriterion(jobs) && jobs.points).toBe(25);
  });

  it("picks 7a when there is no equipment request and does not score 7b", () => {
    const app = makeApplication({
      id: "jobs-only",
      companyName: "Jobs First PLC",
      equipmentRequests: [],
    });
    const track = selectJobCreationTrack(app);
    const scores = scoreApplication(app);
    const ids = scores.map((s) => s.criterionId);

    expect(track.id).toBe("employability");
    expect(ids).toContain("job_creation_employability");
    expect(ids).not.toContain("job_creation_investment");

    const jobs = scores.find((s) => s.criterionId === "job_creation_employability");
    expect(jobs && isScoredCriterion(jobs) && jobs.points).toBe(20);
  });
});

describe("band scorer", () => {
  const app = makeApplication({
    id: "score-test",
    companyName: "Alem Leather Works PLC",
  });

  it("returns one result per active criterion and every citation resolves", () => {
    const scores = scoreApplication(app);
    for (const score of scores) {
      assertRenderableScore(score);
      for (const path of score.citations) {
        expect(citationResolves(app, path), path).toBe(true);
      }
    }
  });

  it("maps Alem leather onto the published bands", () => {
    const byId = Object.fromEntries(
      scoreApplication(app).map((s) => [s.criterionId, s]),
    );

    expect(byId.success_story_sales.status).toBe("scored");
    if (isScoredCriterion(byId.success_story_sales)) {
      expect(byId.success_story_sales.points).toBe(5);
    }
    if (isScoredCriterion(byId.success_story_employment)) {
      expect(byId.success_story_employment.points).toBe(5);
    }
    if (isScoredCriterion(byId.uniqueness)) {
      expect(byId.uniqueness.points).toBe(3);
    }
    if (isScoredCriterion(byId.market_served)) {
      expect(byId.market_served.points).toBe(5);
    }
    if (isScoredCriterion(byId.supply_chain)) {
      expect(byId.supply_chain.points).toBe(3);
    }
    if (isScoredCriterion(byId.ownership_gender)) {
      expect(byId.ownership_gender.points).toBe(5);
    }
    if (isScoredCriterion(byId.expected_results)) {
      expect(byId.expected_results.points).toBe(20);
    }
    if (isScoredCriterion(byId.job_creation_investment)) {
      expect(byId.job_creation_investment.points).toBe(25);
    }
    if (isScoredCriterion(byId.management_capacity)) {
      expect(byId.management_capacity.points).toBe(5);
    }
  });

  it("returns unestablished when sales years are missing", () => {
    const sparse = makeApplication({
      id: "no-sales",
      companyName: "Gap Co",
      growth: {
        ...makeApplication({ id: "x", companyName: "x" }).growth,
        "2023": {
          salesEtb: null,
          totalEmployees: 10,
          femaleEmployees: 4,
          youthEmployees: 2,
        },
      },
    });
    const sales = scoreApplication(sparse).find(
      (s) => s.criterionId === "success_story_sales",
    );
    expect(sales?.status).toBe("unestablished");
  });

  it("scores supply-chain bands from localRawMaterialPct", () => {
    const high = makeApplication({
      id: "high-local",
      companyName: "Local Co",
      localRawMaterialPct: 80,
    });
    const low = makeApplication({
      id: "low-local",
      companyName: "Import Co",
      localRawMaterialPct: 10,
    });
    const highScore = scoreApplication(high).find(
      (s) => s.criterionId === "supply_chain",
    );
    const lowScore = scoreApplication(low).find(
      (s) => s.criterionId === "supply_chain",
    );
    expect(highScore?.status === "scored" && highScore.points).toBe(5);
    expect(lowScore?.status === "scored" && lowScore.points).toBe(0);
  });
});
