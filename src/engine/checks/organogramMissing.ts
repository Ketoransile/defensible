import { isPresent } from "@/lib/fields";
import type { Application, Finding } from "@/types";
import { makeFinding } from "./helpers";

export function organogramMissing(app: Application): Finding[] {
  if (isPresent(app.organogramFile)) return [];
  return [
    makeFinding(
      "ORGANOGRAM_MISSING",
      "defect",
      "Required organogram not uploaded",
      "The form requires the current organisational structure; no file is attached.",
      ["organogramFile"],
      { organogramFile: app.organogramFile },
    ),
  ];
}
