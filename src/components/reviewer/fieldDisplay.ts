import type { FieldPath } from "@/types";

const ENUM_LABELS: Record<string, string> = {
  sole_proprietorship: "Sole proprietorship",
  private_limited_company: "Private limited company",
  share_company: "Share company",
  other: "Other",
  new_in_ethiopia: "New in Ethiopia",
  not_new_but_unique_features: "Not new to Ethiopia, with unique features",
  no_unique_features: "No unique features",
  new_product_service: "New product or service",
  diversification: "Diversification",
  new_clients: "New clients",
  new_markets: "New markets",
  production_capacity: "Production capacity",
  quality: "Quality",
  financial_sustainability: "Financial sustainability",
  female: "Female",
  male: "Male",
};

const FIELD_LABELS: Record<string, string> = {
  companyName: "Company name",
  businessRegistrationNumber: "Business registration number",
  businessLicenseNumber: "Business licence number",
  address: "Address",
  cityRegion: "City and region",
  mobileNumber: "Mobile number",
  email: "Email",
  businessOrgForm: "Legal form",
  yearsInOperation: "Years in operation",
  businessType: "Business type",
  ownershipWomenPct: "Women's ownership",
  ownershipMenPct: "Men's ownership",
  companyOverview: "Company overview",
  motivation: "Motivation",
  businessGoals: "Business goals",
  marketOverview: "Market overview",
  products: "Products and services",
  uniqueness: "Uniqueness",
  uniqueFeatures: "Unique features described",
  localRawMaterialPct: "Local raw-material share",
  keyRawMaterials: "Key raw materials",
  managementTeam: "Management team",
  organogramFile: "Organogram",
  problemsToAddress: "Problems to address",
  equipmentRequests: "Equipment requested",
  consultantRequests: "Consultant requests",
  expectedResults: "Priority areas",
  priorityAreasExplanation: "Why these priority areas",
  jobCreationNarrative: "Job-creation narrative",
  jobPositions: "New jobs table",
  socialEnvironmentalImpact: "Social and environmental impact",
  oshCommitment: "OSH commitment",
  productService: "Product or service",
  marketServed: "Market served",
  distributionChannels: "Distribution channels",
  name: "Name",
  position: "Position",
  gender: "Gender",
  description: "Description",
  quantity: "Quantity",
  estimatedTotalPriceEtb: "Estimated price (ETB)",
  purpose: "Purpose",
  problemDescription: "Problem",
  technicalExpertiseRequest: "Expertise requested",
  newJobs: "New jobs",
};

const GROWTH_LEAF: Record<string, string> = {
  salesEtb: "sales",
  totalEmployees: "total staff",
  femaleEmployees: "female staff",
  youthEmployees: "youth staff (18–24)",
};

const INDEX_RE = /^\d+$/;

function humanize(raw: string): string {
  return raw.replace(/_/g, " ");
}

function yearLabel(year: string): string {
  if (year === "2025_proj") return "2025 projected";
  if (year === "2026_proj") return "2026 projected";
  return year;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/** Reviewer-facing name for a form path. Engine still stores the raw path. */
export function fieldLabel(path: FieldPath): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];

  const parts = path.split(".");

  if (parts[0] === "growth" && parts[1]) {
    const year = yearLabel(parts[1]);
    const leaf = parts[2];
    if (!leaf) return `${year} figures`;
    const leafLabel = GROWTH_LEAF[leaf] ?? humanize(leaf);
    return leaf === "salesEtb"
      ? `${year} ${leafLabel} (ETB)`
      : `${year} ${leafLabel}`;
  }

  if (parts.length >= 2 && INDEX_RE.test(parts[1])) {
    const root = FIELD_LABELS[parts[0]] ?? humanize(parts[0]);
    const n = Number(parts[1]) + 1;
    const leaf = parts[2];
    if (!leaf) return `${root} ${n}`;
    const leafLabel = FIELD_LABELS[leaf] ?? humanize(leaf);
    return `${root} ${n} — ${leafLabel}`;
  }

  const last = parts[parts.length - 1];
  return FIELD_LABELS[last] ?? humanize(last);
}

function formatMoneyEtb(n: number): string {
  return `${n.toLocaleString("en-US")} ETB`;
}

function formatObject(value: Record<string, unknown>): string {
  if ("productService" in value || "marketServed" in value) {
    const lines = [
      asText(value.productService),
      value.marketServed != null ? `Market: ${asText(value.marketServed)}` : null,
      value.distributionChannels != null
        ? `Channels: ${asText(value.distributionChannels)}`
        : null,
    ].filter(Boolean);
    return lines.join("\n") || "Empty product line";
  }

  if ("estimatedTotalPriceEtb" in value || "description" in value) {
    const price = asNumber(value.estimatedTotalPriceEtb);
    const qty = asNumber(value.quantity);
    const bits = [
      asText(value.description) || "Equipment",
      qty != null ? `Qty ${qty}` : null,
      price != null ? formatMoneyEtb(price) : null,
    ].filter(Boolean);
    const purpose = asText(value.purpose);
    return purpose ? `${bits.join(" · ")}\n${purpose}` : bits.join(" · ");
  }

  if ("technicalExpertiseRequest" in value || "problemDescription" in value) {
    const problem = asText(value.problemDescription);
    const ask = asText(value.technicalExpertiseRequest);
    return [problem && `Problem: ${problem}`, ask && `Ask: ${ask}`]
      .filter(Boolean)
      .join("\n");
  }

  if ("newJobs" in value || ("position" in value && !("gender" in value))) {
    const role = asText(value.position) || "Role";
    const jobs = asNumber(value.newJobs);
    return jobs != null ? `${role} — ${jobs} new jobs` : role;
  }

  if ("name" in value && ("position" in value || "gender" in value)) {
    const name = asText(value.name) || "Unnamed";
    const role = asText(value.position);
    const gender = asText(value.gender);
    const extra = [role, gender].filter(Boolean).join(", ");
    return extra ? `${name} — ${extra}` : name;
  }

  if (
    "salesEtb" in value ||
    "totalEmployees" in value ||
    "femaleEmployees" in value
  ) {
    const sales = asNumber(value.salesEtb);
    const staff = asNumber(value.totalEmployees);
    const female = asNumber(value.femaleEmployees);
    const youth = asNumber(value.youthEmployees);
    const lines = [
      sales != null ? `Sales: ${formatMoneyEtb(sales)}` : null,
      staff != null ? `Staff: ${staff.toLocaleString("en-US")}` : null,
      female != null ? `Female staff: ${female.toLocaleString("en-US")}` : null,
      youth != null ? `Youth staff: ${youth.toLocaleString("en-US")}` : null,
    ].filter(Boolean);
    return lines.join("\n") || "No figures";
  }

  return Object.entries(value)
    .map(([k, v]) => `${fieldLabel(k)}: ${formatReviewerValue(v)}`)
    .join("\n");
}

function asText(value: unknown): string {
  if (typeof value !== "string") return "";
  return ENUM_LABELS[value] ?? value;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Readable form answer — never dump camelCase keys or JSON enums. */
export function formatReviewerValue(value: unknown): string {
  if (value === undefined) return "Not on this application";
  if (value === null) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (typeof value === "string") {
    if (value.trim() === "") return "Blank";
    return ENUM_LABELS[value] ?? value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "None listed";
    if (value.every((item) => typeof item === "string")) {
      return value
        .map((item) => ENUM_LABELS[item] ?? humanize(item))
        .join(" · ");
    }
    return value
      .map((item, i) => {
        const body = formatReviewerValue(item);
        return value.length > 1 ? `${i + 1}. ${body}` : body;
      })
      .join("\n\n");
  }
  if (isRecord(value)) return formatObject(value);
  return String(value);
}

export function checkLabel(checkId: string): string {
  const titled = humanize(checkId.toLowerCase()).replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
  return titled.replace(" Vs ", " vs ");
}
