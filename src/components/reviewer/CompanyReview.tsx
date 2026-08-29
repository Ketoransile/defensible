"use client";

import { useState, type ReactNode } from "react";
import { criterionById } from "@/config/criteria";
import { getField } from "@/lib/fields";
import type {
  Application,
  Assessment,
  CriterionScore,
  FieldPath,
  Finding,
} from "@/types";
import { isScoredCriterion, isUnestablishedCriterion } from "@/types";
import {
  eligibilityLabel,
  findingTone,
  formatFieldValue,
  formatPct,
  trackTitle,
} from "./format";

interface CompanyReviewProps {
  assessment: Assessment;
  application: Application;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** Side panel next to the ranked list (animated expand). */
  variant?: "page" | "panel";
}

function ExpandSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-tight">
            {title}
          </span>
          {summary && !open ? (
            <span className="mt-0.5 block truncate text-[13px] text-muted">
              {summary}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 rounded-sm border border-border px-2.5 py-1 font-mono text-[11px] text-muted">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="border-t border-border px-4 py-4">{children}</div> : null}
    </section>
  );
}

function FindingBlock({ finding }: { finding: Finding }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${findingTone(finding.severity)}`}
        >
          {finding.severity}
        </span>
        <span className="font-mono text-[11px] text-muted">{finding.checkId}</span>
      </div>
      <p className="mt-2 text-[14px] font-medium">{finding.title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted">{finding.explanation}</p>
    </div>
  );
}

function CriterionBlock({
  score,
  application,
}: {
  score: CriterionScore;
  application: Application;
}) {
  const def = criterionById(score.criterionId);
  const [open, setOpen] = useState(false);
  const [inspectPath, setInspectPath] = useState<FieldPath | null>(null);
  const scored = isScoredCriterion(score);
  const unestablished = isUnestablishedCriterion(score);
  const band =
    scored
      ? def.bands.find((b) => b.points === score.points)?.label
      : undefined;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-surface-2/40"
      >
        <span className="w-9 shrink-0 font-mono text-[12px] text-muted">
          {def.sn}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px]">{def.label}</span>
          {!open && (
            <span className="mt-0.5 block truncate text-[12px] text-muted">
              {unestablished ? "Unestablished" : band}
            </span>
          )}
        </span>
        <span className="shrink-0 font-mono text-[14px] tabular-nums">
          {scored ? (
            <>
              {score.points}
              <span className="text-muted">/{score.maxPoints}</span>
            </>
          ) : (
            <span className="text-warn">—/{score.maxPoints}</span>
          )}
        </span>
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-muted">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 pb-4 pl-10">
          {scored ? (
            <p className="text-[14px] leading-6 text-foreground/90">
              {score.reasoning}
            </p>
          ) : unestablished ? (
            <div className="space-y-1 text-[14px]">
              <p className="text-warn">{score.reason}</p>
              <p className="text-muted">Ask on site visit: {score.openQuestion}</p>
            </div>
          ) : null}

          {band && (
            <p className="font-mono text-[12px] text-accent">Band: {band}</p>
          )}

          {score.citations.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-wider text-muted uppercase">
                Source fields — tap to view value
              </p>
              <div className="flex flex-wrap gap-2">
                {score.citations.map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() =>
                      setInspectPath((prev) => (prev === path ? null : path))
                    }
                    className={[
                      "rounded-sm border px-2.5 py-1.5 font-mono text-[12px]",
                      inspectPath === path
                        ? "border-accent bg-accent-dim text-accent"
                        : "border-border text-info",
                    ].join(" ")}
                  >
                    {path}
                  </button>
                ))}
              </div>
              {inspectPath && (
                <div className="mt-3 rounded-md border border-accent/30 bg-background p-3">
                  <p className="font-mono text-[11px] text-accent">{inspectPath}</p>
                  <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[13px] leading-5">
                    {formatFieldValue(getField(application, inspectPath))}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CompanyReview({
  assessment,
  application,
  onBack,
  onPrev,
  onNext,
  variant = "page",
}: CompanyReviewProps) {
  const brief = assessment.brief;
  const panel = variant === "panel";
  const groups = (() => {
    const map = new Map<string, CriterionScore[]>();
    for (const score of assessment.criteria) {
      const label = criterionById(score.criterionId).groupLabel;
      const list = map.get(label) ?? [];
      list.push(score);
      map.set(label, list);
    }
    return [...map.entries()];
  })();

  return (
    <div
      className={
        panel
          ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          : "mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8"
      }
    >
      <div
        className={
          panel
            ? "z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3 sm:px-6"
            : "mb-6 flex flex-wrap items-center gap-2"
        }
      >
        <button
          type="button"
          onClick={onBack}
          className="rounded-sm border border-border px-3 py-1.5 text-[13px] text-muted transition hover:border-accent/40 hover:text-foreground"
        >
          {panel ? "Close" : "← Shortlist"}
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="rounded-sm border border-border px-3 py-1.5 text-[13px] text-muted disabled:opacity-30"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="rounded-sm border border-border px-3 py-1.5 text-[13px] text-muted disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      <div
        className={
          panel
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6"
            : ""
        }
      >
      <header className={panel ? "mb-6" : "mb-8"}>
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          Rank {assessment.rank} ·{" "}
          {eligibilityLabel(assessment.eligibility.verdict)} ·{" "}
          {trackTitle(assessment)}
        </p>
        <h2
          className={[
            "mt-2 font-[family-name:var(--font-display)] tracking-tight",
            panel ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
          ].join(" ")}
        >
          {assessment.companyName ?? assessment.applicationId}
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <p className="font-mono text-3xl tabular-nums">
            {assessment.totalPoints}
            <span className="text-lg text-muted">
              /{assessment.maxAvailablePoints}
            </span>
          </p>
          <p className="pb-1 text-[14px] text-muted">
            {formatPct(assessment.confidence)} of the grid established
          </p>
        </div>
        <p className="mt-4 text-[16px] leading-7 text-foreground/90">
          {brief.headline}
        </p>
      </header>

      <div className="space-y-4 pb-8">
        <ExpandSection
          title="Why this rank"
          summary={brief.whyThisRank}
          defaultOpen
        >
          <p className="text-[14px] leading-6 text-foreground/90">
            {brief.whyThisRank}
          </p>
          <p className="mt-3 text-[14px] leading-6 text-muted">
            {brief.justification}
          </p>
          {(brief.strengths.length > 0 || brief.watchouts.length > 0) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {brief.strengths.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-wider text-accent uppercase">
                    Strengths
                  </p>
                  <ul className="list-inside list-disc space-y-1.5 text-[13px] leading-5 text-muted">
                    {brief.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {brief.watchouts.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-wider text-warn uppercase">
                    Watchouts
                  </p>
                  <ul className="list-inside list-disc space-y-1.5 text-[13px] leading-5 text-muted">
                    {brief.watchouts.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ExpandSection>

        <ExpandSection
          title={
            assessment.findings.length === 0
              ? "Findings"
              : `Findings (${assessment.findings.length})`
          }
          summary={
            assessment.findings.length === 0
              ? "No contradictions or defects"
              : assessment.findings.map((f) => f.checkId).join(" · ")
          }
          defaultOpen={assessment.findings.length > 0}
        >
          {assessment.findings.length === 0 ? (
            <p className="text-[14px] text-muted">
              No findings on this application.
            </p>
          ) : (
            <div className="space-y-3">
              {assessment.findings.map((f, i) => (
                <FindingBlock key={`${f.checkId}-${i}`} finding={f} />
              ))}
            </div>
          )}
        </ExpandSection>

        <ExpandSection
          title="Score grid"
          summary={`${assessment.criteria.length} criteria · tap a row for reasoning and fields`}
          defaultOpen
        >
          <div className="space-y-6">
            {groups.map(([groupLabel, scores]) => (
              <div key={groupLabel}>
                <p className="mb-1 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                  {groupLabel}
                </p>
                <div className="rounded-md border border-border bg-background px-3">
                  {scores.map((score) => (
                    <CriterionBlock
                      key={score.criterionId}
                      score={score}
                      application={application}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ExpandSection>
      </div>
      </div>
    </div>
  );
}
