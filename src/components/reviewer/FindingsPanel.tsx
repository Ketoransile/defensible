"use client";

import { getField } from "@/lib/fields";
import type { Application, Assessment, Finding } from "@/types";
import {
  findingTone,
  formatFieldValue,
  groupFindingsBySeverity,
} from "./format";

interface FindingsPanelProps {
  assessment: Assessment;
  application: Application;
}

function FindingCard({
  finding,
  application,
}: {
  finding: Finding;
  application: Application;
}) {
  const cells: { label: string; value: unknown }[] = [];

  for (const path of finding.fields) {
    cells.push({
      label: path,
      value:
        path in finding.values
          ? finding.values[path]
          : getField(application, path),
    });
  }

  for (const [key, value] of Object.entries(finding.values)) {
    if (finding.fields.includes(key)) continue;
    cells.push({ label: key, value });
  }

  return (
    <article className="border border-border bg-surface-2">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${findingTone(finding.severity)}`}
        >
          {finding.severity}
        </span>
        <span className="font-mono text-[11px] text-muted">{finding.checkId}</span>
        <h4 className="w-full text-[13px] font-semibold sm:w-auto sm:flex-1">
          {finding.title}
        </h4>
      </header>

      <p className="border-b border-border px-3 py-2 text-[12px] leading-5">
        {finding.explanation}
      </p>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-background p-3">
            <p className="mb-2 break-all font-mono text-[11px] text-info">
              {cell.label}
            </p>
            <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-foreground">
              {formatFieldValue(cell.value)}
            </pre>
          </div>
        ))}
      </div>
    </article>
  );
}

export function FindingsPanel({ assessment, application }: FindingsPanelProps) {
  const findings = groupFindingsBySeverity(assessment.findings);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div className="flex shrink-0 items-baseline justify-between border-b border-border px-4 py-2">
        <h3 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          Findings
        </h3>
        <span className="font-mono text-[11px] text-muted">
          {findings.length === 0
            ? "Clean file"
            : `${findings.length} finding${findings.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3">
        {findings.length === 0 ? (
          <div className="flex h-full min-h-[8rem] items-center justify-center rounded border border-dashed border-border px-6 text-center">
            <p className="max-w-md text-[12px] text-muted">
              No contradiction, defect, or flag on this application.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((f, i) => (
              <FindingCard
                key={`${f.checkId}-${i}`}
                finding={f}
                application={application}
              />
            ))}
          </div>
        )}

        {assessment.openQuestions.length > 0 && (
          <div className="mt-4 border border-warn/30 bg-warn/5 p-3">
            <p className="mb-2 font-mono text-[10px] tracking-wider text-warn uppercase">
              Open questions
            </p>
            <ul className="list-inside list-disc space-y-1 text-[12px]">
              {assessment.openQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
