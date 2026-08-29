import { describe, expect, it } from "vitest";
import { evaluateEligibility } from "@/engine/eligibility";
import { makeApplication } from "@/fixtures/factory";
import { loadApplication } from "@/lib/loadFixtures";

describe("eligibility", () => {
  it("excludes AGE_OVER_2Y when years in operation is not more than two", () => {
    const app = loadApplication("02-newbloom-cafe");
    const result = evaluateEligibility(app);
    expect(result.verdict).toBe("excluded");
    const age = result.checks.find((c) => c.checkId === "AGE_OVER_2Y");
    expect(age?.verdict).toBe("excluded");
  });

  it("leaves PRIVATELY_OWNED unestablished for a share company", () => {
    const app = loadApplication("03-awash-textile-sc");
    const result = evaluateEligibility(app);
    expect(result.verdict).toBe("unestablished");
    const priv = result.checks.find((c) => c.checkId === "PRIVATELY_OWNED");
    expect(priv?.verdict).toBe("unestablished");
    expect(priv?.openQuestion).toMatch(/shareholder register/i);
  });

  it("treats a private limited company over two years as eligible", () => {
    const app = makeApplication({
      id: "ok",
      companyName: "Ok PLC",
      yearsInOperation: 8,
      businessOrgForm: "private_limited_company",
    });
    expect(evaluateEligibility(app).verdict).toBe("eligible");
  });

  it("does not infer private ownership from other fields on a share company", () => {
    const app = makeApplication({
      id: "sc",
      companyName: "State-looking SC",
      businessOrgForm: "share_company",
      ownershipWomenPct: 100,
      ownershipMenPct: 0,
    });
    const priv = evaluateEligibility(app).checks.find(
      (c) => c.checkId === "PRIVATELY_OWNED",
    );
    expect(priv?.verdict).toBe("unestablished");
  });
});
