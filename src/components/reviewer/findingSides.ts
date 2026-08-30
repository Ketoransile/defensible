import { getField } from "@/lib/fields";
import type { Application, FieldPath, Finding } from "@/types";
import { fieldLabel, formatReviewerValue } from "./fieldDisplay";

export interface FindingSide {
  eyebrow: string;
  value: string;
  caption: string;
  /** Form path when the value is on the application. Omit for scheme rules. */
  path?: FieldPath;
}

export interface FindingDuel {
  left: FindingSide;
  right: FindingSide;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function fieldNumber(app: Application, path: FieldPath): number | null {
  return asNumber(getField(app, path));
}

function compactEtb(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M ETB`;
  }
  if (abs >= 1_000) {
    const k = n / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k ETB`;
  }
  return `${n.toLocaleString("en-US")} ETB`;
}

function compactCount(n: number): string {
  return n.toLocaleString("en-US");
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function emptyLabel(value: unknown): string {
  return formatReviewerValue(value);
}

function fromValues(finding: Finding, key: string): unknown {
  return finding.values[key];
}

function pairFromFields(
  finding: Finding,
  app: Application,
): FindingDuel | null {
  const [a, b] = finding.fields;
  if (!a || !b) return null;
  return {
    left: {
      eyebrow: "Field",
      value: emptyLabel(getField(app, a)),
      caption: fieldLabel(a),
      path: a,
    },
    right: {
      eyebrow: "Field",
      value: emptyLabel(getField(app, b)),
      caption: fieldLabel(b),
      path: b,
    },
  };
}

/**
 * Two conflicting values for the findings duel.
 * Display numbers come from the application (or the check's cited values)
 * so the panel stays traceable.
 */
export function findingSides(
  finding: Finding,
  app: Application,
): FindingDuel | null {
  switch (finding.checkId) {
    case "YEARS_VS_HISTORY": {
      const years =
        fieldNumber(app, "yearsInOperation") ??
        asNumber(fromValues(finding, "yearsInOperation"));
      const year = asString(fromValues(finding, "reportedYear"));
      if (years == null || !year) return null;
      const salesPath: FieldPath = `growth.${year}.salesEtb`;
      const staffPath: FieldPath = `growth.${year}.totalEmployees`;
      const sales = fieldNumber(app, salesPath);
      const staff = fieldNumber(app, staffPath);
      const right: FindingSide =
        sales != null
          ? {
              eyebrow: "Filed",
              value: compactEtb(sales),
              caption: `${year} sales`,
              path: salesPath,
            }
          : {
              eyebrow: "Filed",
              value: staff != null ? compactCount(staff) : year,
              caption: `${year} staff`,
              path: staffPath,
            };
      return {
        left: {
          eyebrow: "Claimed",
          value: compactCount(years),
          caption: "years in operation",
          path: "yearsInOperation",
        },
        right,
      };
    }

    case "SALES_JUMP": {
      const fromYear = asString(fromValues(finding, "fromYear"));
      const toYear = asString(fromValues(finding, "toYear"));
      if (!fromYear || !toYear) return pairFromFields(finding, app);
      const fromPath: FieldPath = `growth.${fromYear}.salesEtb`;
      const toPath: FieldPath = `growth.${toYear}.salesEtb`;
      const from =
        fieldNumber(app, fromPath) ?? asNumber(fromValues(finding, "from"));
      const to =
        fieldNumber(app, toPath) ?? asNumber(fromValues(finding, "to"));
      if (from == null || to == null) return null;
      return {
        left: {
          eyebrow: "From",
          value: compactEtb(from),
          caption: `${fromYear} sales`,
          path: fromPath,
        },
        right: {
          eyebrow: "To",
          value: compactEtb(to),
          caption: `${toYear} sales`,
          path: toPath,
        },
      };
    }

    case "OWNERSHIP_SUM": {
      const women =
        fieldNumber(app, "ownershipWomenPct") ??
        asNumber(fromValues(finding, "ownershipWomenPct"));
      const men =
        fieldNumber(app, "ownershipMenPct") ??
        asNumber(fromValues(finding, "ownershipMenPct"));
      if (women == null || men == null) return null;
      return {
        left: {
          eyebrow: "Women",
          value: `${women}%`,
          caption: fieldLabel("ownershipWomenPct"),
          path: "ownershipWomenPct",
        },
        right: {
          eyebrow: "Men",
          value: `${men}%`,
          caption: fieldLabel("ownershipMenPct"),
          path: "ownershipMenPct",
        },
      };
    }

    case "JOBS_NARRATIVE_VS_TABLE": {
      const narrative = asNumber(fromValues(finding, "narrativeJobs"));
      const table = asNumber(fromValues(finding, "tableJobs"));
      if (narrative == null || table == null) return null;
      return {
        left: {
          eyebrow: "Narrative",
          value: compactCount(narrative),
          caption: "jobs in the write-up",
          path: "jobCreationNarrative",
        },
        right: {
          eyebrow: "Table",
          value: compactCount(table),
          caption: "jobs in the positions table",
          path: "jobPositions",
        },
      };
    }

    case "JOBS_VS_PROJECTION": {
      const table = asNumber(fromValues(finding, "tableJobs"));
      const from = asNumber(fromValues(finding, "employees2025"));
      const to = asNumber(fromValues(finding, "employees2026"));
      if (table == null || from == null || to == null) return null;
      return {
        left: {
          eyebrow: "Table",
          value: compactCount(table),
          caption: "new jobs listed",
          path: "jobPositions",
        },
        right: {
          eyebrow: "Projection",
          value: `${compactCount(from)} → ${compactCount(to)}`,
          caption: "2025–2026 headcount",
          path: "growth.2026_proj.totalEmployees",
        },
      };
    }

    case "FEMALE_GT_TOTAL":
    case "YOUTH_GT_TOTAL": {
      const year = asString(fromValues(finding, "year"));
      const partKey =
        finding.checkId === "FEMALE_GT_TOTAL"
          ? "femaleEmployees"
          : "youthEmployees";
      const part = asNumber(fromValues(finding, partKey));
      const total = asNumber(fromValues(finding, "totalEmployees"));
      if (!year || part == null || total == null) return pairFromFields(finding, app);
      const partPath: FieldPath = `growth.${year}.${partKey}`;
      const totalPath: FieldPath = `growth.${year}.totalEmployees`;
      return {
        left: {
          eyebrow: finding.checkId === "FEMALE_GT_TOTAL" ? "Female" : "Youth",
          value: compactCount(part),
          caption: fieldLabel(partPath),
          path: partPath,
        },
        right: {
          eyebrow: "Total",
          value: compactCount(total),
          caption: fieldLabel(totalPath),
          path: totalPath,
        },
      };
    }

    case "UNIQUENESS_UNSUPPORTED": {
      const level =
        asString(getField(app, "uniqueness")) ??
        asString(fromValues(finding, "uniqueness"));
      if (!level) return null;
      const features = getField(app, "uniqueFeatures");
      return {
        left: {
          eyebrow: "Claimed",
          value: humanize(level),
          caption: fieldLabel("uniqueness"),
          path: "uniqueness",
        },
        right: {
          eyebrow: "Filed",
          value: emptyLabel(features),
          caption: fieldLabel("uniqueFeatures"),
          path: "uniqueFeatures",
        },
      };
    }

    case "SOLE_PROP_MULTI_OWNER": {
      const women =
        fieldNumber(app, "ownershipWomenPct") ??
        asNumber(fromValues(finding, "ownershipWomenPct"));
      const men =
        fieldNumber(app, "ownershipMenPct") ??
        asNumber(fromValues(finding, "ownershipMenPct"));
      if (women == null || men == null) return null;
      return {
        left: {
          eyebrow: "Legal form",
          value: "sole prop",
          caption: fieldLabel("businessOrgForm"),
          path: "businessOrgForm",
        },
        right: {
          eyebrow: "Register",
          value: `${women}% / ${men}%`,
          caption: "women / men ownership",
          path: "ownershipWomenPct",
        },
      };
    }

    case "EQUIPMENT_OVER_CAP": {
      const eur = asNumber(fromValues(finding, "equivalentEur"));
      const cap = asNumber(fromValues(finding, "capEur"));
      if (eur == null || cap == null) return null;
      return {
        left: {
          eyebrow: "Requested",
          value: `€${Math.round(eur).toLocaleString("en-US")}`,
          caption: fieldLabel("equipmentRequests"),
          path: "equipmentRequests",
        },
        right: {
          eyebrow: "Scheme cap",
          value: `€${Math.round(cap).toLocaleString("en-US")}`,
          caption: "sequa contribution",
        },
      };
    }

    case "CONSULTANT_COUNT": {
      const count = asNumber(fromValues(finding, "count"));
      const max = asNumber(fromValues(finding, "max"));
      if (count == null || max == null) return null;
      return {
        left: {
          eyebrow: "Listed",
          value: compactCount(count),
          caption: fieldLabel("consultantRequests"),
          path: "consultantRequests",
        },
        right: {
          eyebrow: "Scheme max",
          value: compactCount(max),
          caption: "three problems",
        },
      };
    }

    case "PRIORITY_AREAS_COUNT": {
      const count = asNumber(fromValues(finding, "count"));
      const required = asNumber(fromValues(finding, "required"));
      if (count == null || required == null) return null;
      return {
        left: {
          eyebrow: "Listed",
          value: compactCount(count),
          caption: fieldLabel("expectedResults"),
          path: "expectedResults",
        },
        right: {
          eyebrow: "Required",
          value: compactCount(required),
          caption: "exactly three areas",
        },
      };
    }

    case "PROJECTION_BREAK": {
      const proj = asNumber(fromValues(finding, "projectionMultiple"));
      const hist = asNumber(fromValues(finding, "historicalMaxMultiple"));
      if (proj == null || hist == null) return pairFromFields(finding, app);
      return {
        left: {
          eyebrow: "2025→2026",
          value: `${proj.toFixed(1)}×`,
          caption: fieldLabel("growth.2026_proj.salesEtb"),
          path: "growth.2026_proj.salesEtb",
        },
        right: {
          eyebrow: "History",
          value: `${hist.toFixed(1)}×`,
          caption: "largest prior year-on-year",
          path: "growth.2024.salesEtb",
        },
      };
    }

    case "RAW_MATERIAL_RANGE": {
      const pct =
        fieldNumber(app, "localRawMaterialPct") ??
        asNumber(fromValues(finding, "localRawMaterialPct"));
      if (pct == null) return null;
      return {
        left: {
          eyebrow: "Filed",
          value: String(pct),
          caption: fieldLabel("localRawMaterialPct"),
          path: "localRawMaterialPct",
        },
        right: {
          eyebrow: "Valid range",
          value: "0–100",
          caption: "percentage",
        },
      };
    }

    case "REQUIRED_FIELD_MISSING":
    case "ORGANOGRAM_MISSING":
      return null;

    default:
      return pairFromFields(finding, app);
  }
}
