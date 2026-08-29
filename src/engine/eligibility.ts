import { THRESHOLDS } from "@/config/thresholds";
import type {
  Application,
  EligibilityCheck,
  EligibilityResult,
  EligibilityVerdict,
} from "@/types";

function combine(verdicts: EligibilityVerdict[]): EligibilityVerdict {
  if (verdicts.includes("excluded")) return "excluded";
  if (verdicts.includes("unestablished")) return "unestablished";
  return "eligible";
}

function ageCheck(app: Application): EligibilityCheck {
  const years = app.yearsInOperation;
  if (years == null) {
    return {
      checkId: "AGE_OVER_2Y",
      verdict: "unestablished",
      explanation:
        "Years in operation is missing, so the two-year eligibility rule cannot be applied.",
      fields: ["yearsInOperation"],
      openQuestion:
        "Confirm the business licence date. The scheme requires more than two years in operation.",
    };
  }
  if (years > THRESHOLDS.eligibilityMinYearsExclusive) {
    return {
      checkId: "AGE_OVER_2Y",
      verdict: "eligible",
      explanation: `Years in operation is ${years}, which is more than two.`,
      fields: ["yearsInOperation"],
    };
  }
  return {
    checkId: "AGE_OVER_2Y",
    verdict: "excluded",
    explanation: `Years in operation is ${years}, which is not more than two.`,
    fields: ["yearsInOperation"],
  };
}

function privatelyOwnedCheck(app: Application): EligibilityCheck {
  const form = app.businessOrgForm;
  if (form == null) {
    return {
      checkId: "PRIVATELY_OWNED",
      verdict: "unestablished",
      explanation: "Form of business organisation is missing.",
      fields: ["businessOrgForm"],
      openQuestion:
        "Confirm the legal form and that no state entity holds shares.",
    };
  }
  if (form === "share_company") {
    return {
      checkId: "PRIVATELY_OWNED",
      verdict: "unestablished",
      explanation:
        "A share company may have state participation; the form does not exclude it.",
      fields: ["businessOrgForm"],
      openQuestion:
        "Confirm shareholder register shows no state entity holding.",
    };
  }
  if (form === "other") {
    return {
      checkId: "PRIVATELY_OWNED",
      verdict: "unestablished",
      explanation:
        "Legal form is “other”; private ownership is not established from the form.",
      fields: ["businessOrgForm"],
      openQuestion:
        "Confirm the legal form is privately owned with no state entity holding.",
    };
  }
  return {
    checkId: "PRIVATELY_OWNED",
    verdict: "eligible",
    explanation:
      form === "sole_proprietorship"
        ? "Sole proprietorship is treated as privately owned."
        : "Private limited company is treated as privately owned.",
    fields: ["businessOrgForm"],
  };
}

export function evaluateEligibility(app: Application): EligibilityResult {
  const checks = [ageCheck(app), privatelyOwnedCheck(app)];
  return {
    verdict: combine(checks.map((c) => c.verdict)),
    checks,
  };
}
