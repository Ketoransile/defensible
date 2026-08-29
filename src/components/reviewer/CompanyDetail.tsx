"use client";

import { criterionById } from "@/config/criteria";
import type {
  Application,
  Assessment,
  CriterionScore,
  FieldPath,
} from "@/types";
import { isScoredCriterion, isUnestablishedCriterion } from "@/types";
import { trackTitle } from "./format";

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Company detail · rank {assessment.rank}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight">
              {assessment.companyName ?? assessment.applicationId}
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-foreground/90">
              {brief.headline}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 font-mono text-[11px]">
            <span className="text-foreground">
              {assessment.totalPoints}
              <span className="text-muted">
                {" "}
                / {assessment.maxAvailablePoints} established
              </span>
            </span>
            <span className="rounded border border-info/40 bg-info/10 px-2 py-0.5 text-info">
              {trackTitle(assessment)}
            </span>
            <span className="text-muted">
              brief · {brief.source}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-muted">{brief.whyThisRank}</p>
        <p className="mt-2 text-[12px] leading-5 text-foreground/85">
          {brief.justification}
        </p>
        {(brief.strengths.length > 0 || brief.watchouts.length > 0) && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {brief.strengths.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] tracking-wider text-accent uppercase">
                  Strengths
                </p>
                <ul className="list-inside list-disc space-y-1 text-[11px] leading-4 text-muted">
                  {brief.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {brief.watchouts.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] tracking-wider text-warn uppercase">
                  Watchouts
                </p>
                <ul className="list-inside list-disc space-y-1 text-[11px] leading-4 text-muted">
                  {brief.watchouts.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="mt-2 font-mono text-[11px] text-muted">
          {assessment.jobCreationTrack.reason}
        </p>
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
                      unestablished
                        ? "bg-[var(--unestablished)]/50"
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(score.criterionId)}
                      className="flex w-full items-stretch gap-3 border-b border-border/50 px-4 py-2.5 text-left hover:bg-surface-2/80"
                    >
                      <span className="w-8 shrink-0 font-mono text-[11px] text-muted">
                        {row.sn}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium">
                          {row.label}
                        </span>
                        {unestablished && (
                          <span className="mt-0.5 block text-[11px] text-warn">
                            Unestablished — not scored as zero
                          </span>
                        )}
                        {scored && band && (
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-muted">
                            {band}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 self-center font-mono tabular-nums">
                        {scored ? (
                          <span>
                            {score.points}
                            <span className="text-muted">/{score.maxPoints}</span>
                          </span>
                        ) : (
                          <span className="text-warn">—/{score.maxPoints}</span>
                        )}
                      </span>
                      <span className="self-center font-mono text-[10px] text-muted">
                        {expanded ? "▾" : "▸"}
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-3 border-b border-border bg-background/60 px-4 py-3 pl-14">
                        {scored ? (
                          <>
                            <p className="text-[12px] leading-5 text-foreground/90">
                              {score.reasoning}
                            </p>
                            {band && (
                              <p className="font-mono text-[11px] text-accent">
                                Matched band: {band}
                              </p>
                            )}
                          </>
                        ) : unestablished ? (
                          <div className="space-y-2 rounded border border-warn/30 bg-warn/5 p-3">
                            <p className="text-[12px] text-warn">{score.reason}</p>
                            <p className="text-[12px]">
                              <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                                Site-visit question ·{" "}
                              </span>
                              {score.openQuestion}
                            </p>
                          </div>
                        ) : null}

                        <div>
                          <p className="mb-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">
                            Citations — click to inspect field
                          </p>
                          {score.citations.length === 0 ? (
                            <p className="font-mono text-[11px] text-muted">
                              No citations (unestablished / nothing inspected)
                            </p>
                          ) : (
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
                                    "rounded border px-2 py-1 font-mono text-[11px] transition-colors",
                                    activeCitation === path
                                      ? "border-accent bg-accent-dim text-accent"
                                      : "border-border bg-surface text-info hover:border-info/60",
                                  ].join(" ")}
                                >
                                  {path}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
