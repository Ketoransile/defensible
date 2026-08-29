"use client";

import { criterionById } from "@/config/criteria";
import type {
  Application,
  Assessment,
  CriterionScore,
  FieldPath,
} from "@/types";
import { isScoredCriterion, isUnestablishedCriterion } from "@/types";
import {
  eligibilityLabel,
  findingTone,
  formatPct,
  trackTitle,
} from "./format";

interface CompanyDetailProps {
  assessment: Assessment;
  application: Application;
  expandedId: string | null;
  onToggle: (criterionId: string) => void;
  activeCitation: FieldPath | null;
  onCitationClick: (path: FieldPath) => void;
}

interface CriterionRowModel {
  score: CriterionScore;
  sn: string;
  label: string;
  groupLabel: string;
  bands: { label: string; points: number }[];
}

function buildRows(assessment: Assessment): {
  groups: { groupLabel: string; rows: CriterionRowModel[] }[];
} {
  const rows: CriterionRowModel[] = assessment.criteria.map((score) => {
    const def = criterionById(score.criterionId);
    return {
      score,
      sn: def.sn,
      label: def.label,
      groupLabel: def.groupLabel,
      bands: def.bands,
    };
  });

  const groups: { groupLabel: string; rows: CriterionRowModel[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.groupLabel === row.groupLabel) {
      last.rows.push(row);
    } else {
      groups.push({ groupLabel: row.groupLabel, rows: [row] });
    }
  }
  return { groups };
}

function matchedBandLabel(row: CriterionRowModel): string | null {
  const score = row.score;
  if (!isScoredCriterion(score)) return null;
  const band = row.bands.find((b) => b.points === score.points);
  return band?.label ?? null;
}

export function CompanyDetail({
  assessment,
  expandedId,
  onToggle,
  activeCitation,
  onCitationClick,
}: CompanyDetailProps) {
  const { groups } = buildRows(assessment);
  const brief = assessment.brief;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="shrink-0 space-y-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
              Rank {assessment.rank} · {eligibilityLabel(assessment.eligibility.verdict)}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              {assessment.companyName ?? assessment.applicationId}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2 font-mono text-[12px]">
            <span className="tabular-nums">
              <span className="text-base font-semibold text-foreground">
                {assessment.totalPoints}
              </span>
              <span className="text-muted">
                /{assessment.maxAvailablePoints}
              </span>
            </span>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">
              {formatPct(assessment.confidence)}
            </span>
            <span className="rounded border border-info/40 bg-info/10 px-1.5 py-0.5 text-[10px] text-info">
              {trackTitle(assessment)}
            </span>
          </div>
        </div>

        <p className="text-[13px] leading-5 text-foreground/90">{brief.headline}</p>
        <p className="text-[12px] leading-5 text-muted">{brief.whyThisRank}</p>

        {assessment.findings.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {assessment.findings.map((f, i) => (
              <span
                key={`${f.checkId}-${i}`}
                className={`rounded border px-2 py-1 font-mono text-[10px] ${findingTone(f.severity)}`}
                title={f.explanation}
              >
                {f.checkId}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        {groups.map((group) => (
          <section key={group.groupLabel} className="border-b border-border">
            <h3 className="sticky top-0 z-[1] border-b border-border/60 bg-surface-2 px-4 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
              {group.groupLabel}
            </h3>
            <ul>
              {group.rows.map((row) => {
                const score = row.score;
                const expanded = expandedId === score.criterionId;
                const scored = isScoredCriterion(score);
                const unestablished = isUnestablishedCriterion(score);
                const band = matchedBandLabel(row);

                return (
                  <li
                    key={score.criterionId}
                    className={
                      unestablished ? "bg-[var(--unestablished)]/40" : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(score.criterionId)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2/80"
                    >
                      <span className="w-8 shrink-0 font-mono text-[11px] text-muted">
                        {row.sn}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px]">{row.label}</span>
                        {unestablished ? (
                          <span className="text-[11px] text-warn">
                            Unestablished
                          </span>
                        ) : band ? (
                          <span className="block truncate font-mono text-[10px] text-muted">
                            {band}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {scored ? (
                          <>
                            {score.points}
                            <span className="text-muted">/{score.maxPoints}</span>
                          </>
                        ) : (
                          <span className="text-warn">—/{score.maxPoints}</span>
                        )}
                      </span>
                      <span className="w-3 font-mono text-[10px] text-muted">
                        {expanded ? "▾" : "▸"}
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-2 border-t border-border/40 bg-background/70 px-4 py-3 pl-14">
                        {scored ? (
                          <p className="text-[12px] leading-5">{score.reasoning}</p>
                        ) : unestablished ? (
                          <div className="space-y-1 text-[12px]">
                            <p className="text-warn">{score.reason}</p>
                            <p className="text-muted">
                              Ask: {score.openQuestion}
                            </p>
                          </div>
                        ) : null}

                        {score.citations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {score.citations.map((path) => (
                              <button
                                key={path}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCitationClick(path);
                                }}
                                className={[
                                  "rounded border px-2 py-1 font-mono text-[11px]",
                                  activeCitation === path
                                    ? "border-accent bg-accent-dim text-accent"
                                    : "border-border text-info hover:border-info/50",
                                ].join(" ")}
                              >
                                {path}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
