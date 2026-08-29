import type { Application, FieldPath, Finding, GrowthYear, Severity } from "@/types";

export type CheckFn = (app: Application) => Finding[];

export const HISTORICAL_YEARS: GrowthYear[] = ["2022", "2023", "2024"];


export function rowHasFigures(app: Application, year: GrowthYear): boolean {
  const row = app.growth[year];
  return (
    row.salesEtb != null ||
    row.totalEmployees != null ||
    row.femaleEmployees != null ||
    row.youthEmployees != null
  );
}

export function makeFinding(
  checkId: string,
  severity: Severity,
  title: string,
  explanation: string,
  fields: FieldPath[],
  values: Record<string, unknown>,
): Finding {
  return { checkId, severity, title, explanation, fields, values };
}
