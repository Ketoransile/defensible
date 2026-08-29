import { REQUIRED_FIELD_PATHS } from "@/config/thresholds";
import { getField, isPresent } from "@/lib/fields";
import type { Application, FieldPath, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function requiredFieldMissing(app: Application): Finding[] {
  const missing: FieldPath[] = REQUIRED_FIELD_PATHS.filter(
    (path) => !isPresent(getField(app, path)),
  );
  if (missing.length === 0) return [];
  const values = Object.fromEntries(missing.map((path) => [path, getField(app, path)]));
  return [
    makeFinding(
      "REQUIRED_FIELD_MISSING",
      "defect",
      "Required form fields are empty",
      `${missing.length} required ${missing.length === 1 ? "field is" : "fields are"} null or blank: ${missing.join(", ")}.`,
      missing,
      values,
    ),
  ];
}
