"use client";

import type { Assessment } from "@/types";
import {
  eligibilityLabel,
  findingTone,
  formatPct,
  formatPoints,
  trackLabel,
} from "./format";

interface BatchViewProps {
  assessments: Assessment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function eligibilityClass(verdict: Assessment["eligibility"]["verdict"]): string {
  switch (verdict) {
    case "eligible":
      return "text-accent";
    case "excluded":
      return "text-danger";
    case "unestablished":
      return "text-warn";
  }
}

export function BatchView({
  assessments,
  selectedId,
  onSelect,
}: BatchViewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-baseline justify-between border-b border-border px-4 py-2">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          Batch · {assessments.length} applications
        </h2>
        <p className="font-mono text-[11px] text-muted">
          Official grid · 100 pts · 7a/7b exclusive
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain">
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-border font-mono text-[10px] tracking-wider text-muted uppercase">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Points</th>
              <th className="px-3 py-2 font-medium">Conf.</th>
              <th className="px-3 py-2 font-medium">Track</th>
              <th className="px-3 py-2 font-medium">Eligibility</th>
              <th className="px-3 py-2 font-medium">Findings</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => {
              const excluded = a.eligibility.verdict === "excluded";
              const selected = a.applicationId === selectedId;
              return (
                <tr
                  key={a.applicationId}
                  onClick={() => onSelect(a.applicationId)}
                  className={[
                    "cursor-pointer border-b border-border/70 transition-colors",
                    excluded ? "bg-[var(--excluded)]/40 opacity-80" : "",
                    selected ? "bg-accent-dim" : "hover:bg-surface-2",
                  ].join(" ")}
                >
                  <td className="px-3 py-2 align-top font-mono text-muted tabular-nums">
                    {excluded ? "—" : a.rank}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium text-foreground">
                      {a.companyName ?? a.applicationId}
                    </div>
                    <div className="mt-0.5 max-w-[22rem] text-[11px] leading-4 text-muted">
                      {a.brief.headline}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted/80">
                      {a.applicationId}
                      {a.brief.source === "gemini" ? " · gemini" : " · template"}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top font-mono tabular-nums">
                    {formatPoints(a.totalPoints, a.maxAvailablePoints)}
                  </td>
                  <td className="px-3 py-2 align-top font-mono tabular-nums text-muted">
                    {formatPct(a.confidence)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-info">
                      {trackLabel(a)}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 align-top font-mono text-[11px] ${eligibilityClass(a.eligibility.verdict)}`}
                  >
                    {eligibilityLabel(a.eligibility.verdict)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {a.findings.length === 0 ? (
                      <span className="font-mono text-[10px] text-muted">
                        none
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {a.findings.map((f, i) => (
                          <span
                            key={`${f.checkId}-${i}`}
                            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${findingTone(f.severity)}`}
                            title={f.title}
                          >
                            {f.checkId}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
