import { getField } from "@/lib/fields";
import type { Application, FieldPath } from "@/types";
import { fieldLabel, formatReviewerValue } from "./fieldDisplay";

export function FieldInspect({
  path,
  application,
}: {
  path: FieldPath;
  application: Application;
}) {
  return (
    <div className="mt-3 rounded-md border border-accent/30 bg-background p-3">
      <p className="text-[14px] font-semibold tracking-tight">{fieldLabel(path)}</p>
      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-foreground/90">
        {formatReviewerValue(getField(application, path))}
      </p>
      <p className="mt-2 font-mono text-[10px] text-muted">{path}</p>
    </div>
  );
}
