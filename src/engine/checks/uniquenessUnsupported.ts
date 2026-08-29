import { isPresent } from "@/lib/fields";
import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function uniquenessUnsupported(app: Application): Finding[] {
  const level = app.uniqueness;
  const features = app.uniqueFeatures;
  if (level == null) return [];

  const claimsUnique = level === "not_new_but_unique_features";
  if (claimsUnique && !isPresent(features)) {
    return [
      makeFinding(
        "UNIQUENESS_UNSUPPORTED",
        "contradiction",
        "Unique features claimed but not described",
        `Uniqueness is “${level}” but uniqueFeatures is empty.`,
        ["uniqueness", "uniqueFeatures"],
        { uniqueness: level, uniqueFeatures: features },
      ),
    ];
  }
  if (level === "no_unique_features" && isPresent(features)) {
    return [
      makeFinding(
        "UNIQUENESS_UNSUPPORTED",
        "contradiction",
        "Unique features listed while uniqueness is “none”",
        "The form says there are no unique features, but uniqueFeatures is filled in.",
        ["uniqueness", "uniqueFeatures"],
        { uniqueness: level, uniqueFeatures: features },
      ),
    ];
  }
  return [];
}
