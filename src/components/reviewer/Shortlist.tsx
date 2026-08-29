"use client";

import type { Assessment } from "@/types";
import {
  eligibilityLabel,
  findingTone,
  formatPct,
  trackLabel,
} from "./format";

interface ShortlistProps {
  assessments: Assessment[];
  onOpen: (id: string) => void;
}

function eligibilityTone(verdict: Assessment["eligibility"]["verdict"]): string {
  switch (verdict) {
    case "eligible":
      return "text-accent";
    case "excluded":
      return "text-danger";
    case "unestablished":
      return "text-warn";
  }
}

export function Shortlist({ assessments, onOpen }: ShortlistProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          Shortlist · {assessments.length} applications
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Ranked applicants
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
          Open a company to see why it ranks here, what findings apply, and every
          score with the fields behind it.
        </p>
      </div>

      <ol className="space-y-3">
        {assessments.map((a) => {
          const excluded = a.eligibility.verdict === "excluded";
          return (
            <li key={a.applicationId}>
              <button
                type="button"
                onClick={() => onOpen(a.applicationId)}
                className={[
                  "group flex w-full flex-col gap-3 rounded-md border border-border bg-surface px-4 py-4 text-left transition hover:border-accent/40 hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-5",
                  excluded ? "opacity-75" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <span className="w-8 shrink-0 pt-0.5 font-mono text-sm text-muted tabular-nums">
                    {excluded ? "—" : a.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold tracking-tight">
                      {a.companyName ?? a.applicationId}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">
                      {a.brief.headline}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={eligibilityTone(a.eligibility.verdict)}>
                        {eligibilityLabel(a.eligibility.verdict)}
                      </span>
                      <span className="text-muted">·</span>
                      <span className="text-info">{trackLabel(a)}</span>
                      {a.findings.length > 0 && (
                        <>
                          <span className="text-muted">·</span>
                          <span className="text-warn">
                            {a.findings.length} finding
                            {a.findings.length === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </div>
                    {a.findings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.findings.slice(0, 3).map((f, i) => (
                          <span
                            key={`${f.checkId}-${i}`}
                            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${findingTone(f.severity)}`}
                          >
                            {f.checkId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="font-mono text-xl tabular-nums">
                      {a.totalPoints}
                      <span className="text-sm text-muted">
                        /{a.maxAvailablePoints}
                      </span>
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {formatPct(a.confidence)} established
                    </p>
                  </div>
                  <span className="rounded-sm border border-border px-3 py-1.5 text-[12px] text-accent transition group-hover:border-accent/50 group-hover:bg-accent-dim">
                    Review →
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
