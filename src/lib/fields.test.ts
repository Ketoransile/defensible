import { describe, expect, it } from "vitest";
import type { Application } from "@/types";
import { citationResolves, getField, validateCitations } from "@/lib/fields";
import { makeApplication } from "@/fixtures/factory";

const app: Application = makeApplication({
  id: "test",
  companyName: "Test Co",
});

describe("getField", () => {
  it("reads a top-level field", () => {
    expect(getField(app, "companyName")).toBe("Test Co");
  });

  it("reads a nested growth cell", () => {
    expect(getField(app, "growth.2024.femaleEmployees")).toBe(13);
  });

  it("reads an array element by index", () => {
    expect(getField(app, "products.0.productService")).toBe(
      "Finished leather bags",
    );
  });

  it("returns undefined for a missing path", () => {
    expect(getField(app, "products.9.productService")).toBeUndefined();
  });
});

describe("citationResolves", () => {
  it("accepts real field paths", () => {
    expect(citationResolves(app, "ownershipWomenPct")).toBe(true);
    expect(citationResolves(app, "jobPositions.0.newJobs")).toBe(true);
  });

  it("rejects fabricated paths", () => {
    expect(citationResolves(app, "made.up.field")).toBe(false);
    expect(citationResolves(app, "products.99.productService")).toBe(false);
  });

  it("splits valid and invalid citations", () => {
    const { valid, invalid } = validateCitations(app, [
      "yearsInOperation",
      "growth.1999.salesEtb",
    ]);
    expect(valid).toEqual(["yearsInOperation"]);
    expect(invalid).toEqual(["growth.1999.salesEtb"]);
  });
});
