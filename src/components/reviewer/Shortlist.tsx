"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Assessment, EligibilityVerdict } from "@/types";
import { checkLabel } from "./fieldDisplay";
import {
  eligibilityLabel,
  findingTone,
  formatPct,
  trackLabel,
} from "./format";
import { useCountUp } from "./useCountUp";

interface ShortlistProps {
  assessments: Assessment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type EligibilityFilter = "all" | EligibilityVerdict;
type TrackFilter = "all" | "7a" | "7b";
type FindingsFilter = "all" | "with" | "clean";
type SortKey = "rank" | "points" | "name";
/** Cap how many filtered rows to render; 0 = show all. */
type LimitOption = 0 | 5 | 10 | 25 | 50;

/** One short line for the ranked list — never a clipped Gemini essay. */
export function shortlistKicker(a: Assessment): string {
  if (a.eligibility.verdict === "excluded") return "Fails the two-year rule";
  if (a.eligibility.verdict === "unestablished") {
    return "Private ownership not established";
  }
  const first = a.findings[0];
  if (first) return first.title;
  return a.rank === 1 ? "Clean file — shortlist lead" : "No findings on this file";
}

function eligibilityTone(verdict: EligibilityVerdict): string {
  switch (verdict) {
    case "eligible":
      return "text-accent";
    case "excluded":
      return "text-danger";
    case "unestablished":
      return "text-warn";
  }
}

function scoreRatio(points: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, points / max));
}

function ScoreBar({
  points,
  max,
  delayMs,
  variant,
}: {
  points: number;
  max: number;
  delayMs: number;
  variant: "lead" | "podium" | "row" | "excluded";
}) {
  return (
    <div className={`score-bar score-bar--${variant}`} aria-hidden>
      <div
        className="score-bar-fill"
        style={
          {
            "--score": String(scoreRatio(points, max)),
            animationDelay: `${delayMs}ms`,
          } as CSSProperties
        }
      />
    </div>
  );
}

function ShortlistRow({
  assessment: a,
  index,
  selected,
  onSelect,
}: {
  assessment: Assessment;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const excluded = a.eligibility.verdict === "excluded";
  const podium = !excluded && a.rank >= 1 && a.rank <= 3;
  const lead = podium && a.rank === 1;
  const delay = Math.min(index, 16) * 55;
  const points = useCountUp(a.totalPoints, { delay });
  const barVariant = excluded ? "excluded" : lead ? "lead" : podium ? "podium" : "row";

  return (
    <li
      className="animate-list-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => onSelect(a.applicationId)}
        aria-pressed={selected}
        className={[
          "group relative flex w-full items-start gap-3 text-left transition sm:px-5",
          podium ? "px-4 py-5" : "px-4 py-3.5",
          lead ? "shortlist-row--lead" : "",
          selected
            ? "bg-accent-dim/60 ring-1 ring-inset ring-accent/35"
            : "hover:bg-surface-2/50",
          excluded ? "opacity-75" : "",
        ].join(" ")}
      >
        <span
          className={[
            "mt-0.5 w-10 shrink-0 tabular-nums",
            podium ? "shortlist-rank--podium" : "",
            lead
              ? "font-[family-name:var(--font-display)] text-[28px] leading-none text-accent"
              : podium
                ? "font-[family-name:var(--font-display)] text-[22px] leading-none text-foreground"
                : selected
                  ? "font-mono text-[13px] text-accent"
                  : "font-mono text-[13px] text-muted",
          ].join(" ")}
          style={podium ? { animationDelay: `${delay}ms` } : undefined}
        >
          {excluded ? "—" : podium ? a.rank : String(a.rank).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={[
              "block truncate font-semibold tracking-tight",
              podium ? "text-[16px]" : "text-[14px]",
            ].join(" ")}
          >
            {a.companyName ?? a.applicationId}
          </span>
          <span className="mt-0.5 line-clamp-1 text-[12px] text-muted">
            {shortlistKicker(a)}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            <span className={eligibilityTone(a.eligibility.verdict)}>
              {eligibilityLabel(a.eligibility.verdict)}
            </span>
            <span className="text-info">{trackLabel(a)}</span>
            {a.findings.slice(0, 1).map((f, i) => (
              <span
                key={`${f.checkId}-${i}`}
                className={`rounded border px-1 py-0.5 font-mono text-[9px] ${findingTone(f.severity)}`}
              >
                {checkLabel(f.checkId)}
              </span>
            ))}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-[15px] tabular-nums">
            <span className="sr-only">
              {a.totalPoints}/{a.maxAvailablePoints}
            </span>
            <span aria-hidden>
              {points}
              <span className="text-[11px] text-muted">
                /{a.maxAvailablePoints}
              </span>
            </span>
          </span>
          <span className="font-mono text-[10px] text-muted">
            {formatPct(a.confidence)}
          </span>
        </span>
        <ScoreBar
          points={a.totalPoints}
          max={a.maxAvailablePoints}
          delayMs={delay + 80}
          variant={barVariant}
        />
      </button>
    </li>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-0.5 text-[11px] transition",
        active
          ? "border-accent bg-accent-dim text-accent"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Shortlist({
  assessments,
  selectedId,
  onSelect,
}: ShortlistProps) {
  const [query, setQuery] = useState("");
  const [eligibility, setEligibility] = useState<EligibilityFilter>("all");
  const [track, setTrack] = useState<TrackFilter>("all");
  const [findings, setFindings] = useState<FindingsFilter>("all");
  const [rankMin, setRankMin] = useState("");
  const [rankMax, setRankMax] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");
  const [limit, setLimit] = useState<LimitOption>(0);

  const matched = useMemo(() => {
    const min = rankMin === "" ? null : Number(rankMin);
    const max = rankMax === "" ? null : Number(rankMax);
    const q = query.trim().toLowerCase();

    let list = assessments.filter((a) => {
      if (eligibility !== "all" && a.eligibility.verdict !== eligibility) {
        return false;
      }
      const t = trackLabel(a);
      if (track !== "all" && t !== track) return false;
      if (findings === "with" && a.findings.length === 0) return false;
      if (findings === "clean" && a.findings.length > 0) return false;
      if (min != null && !Number.isNaN(min) && a.rank < min) return false;
      if (max != null && !Number.isNaN(max) && a.rank > max) return false;
      if (q) {
        const hay =
          `${a.companyName ?? ""} ${a.applicationId} ${a.brief.headline}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "points") return b.totalPoints - a.totalPoints;
      if (sort === "name") {
        return (a.companyName ?? a.applicationId).localeCompare(
          b.companyName ?? b.applicationId,
        );
      }
      return a.rank - b.rank;
    });

    return list;
  }, [
    assessments,
    eligibility,
    track,
    findings,
    rankMin,
    rankMax,
    query,
    sort,
  ]);

  const filtered = limit > 0 ? matched.slice(0, limit) : matched;

  const hasFilters =
    query !== "" ||
    eligibility !== "all" ||
    track !== "all" ||
    findings !== "all" ||
    rankMin !== "" ||
    rankMax !== "" ||
    sort !== "rank" ||
    limit !== 0;

  function clearFilters() {
    setQuery("");
    setEligibility("all");
    setTrack("all");
    setFindings("all");
    setRankMin("");
    setRankMax("");
    setSort("rank");
    setLimit(0);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-border px-4 py-4 sm:px-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            {limit > 0 && matched.length > filtered.length
              ? `Showing ${filtered.length} of ${matched.length} · ${assessments.length} total`
              : matched.length !== assessments.length
                ? `${matched.length} matched · ${assessments.length} total`
                : `${assessments.length} applications`}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight">
            Ranked shortlist
          </h2>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none transition focus:border-accent"
        />

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            value={rankMin}
            onChange={(e) => setRankMin(e.target.value)}
            placeholder="Rank from"
            className="w-[4.5rem] rounded-md border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-accent"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={1}
            value={rankMax}
            onChange={(e) => setRankMax(e.target.value)}
            placeholder="To"
            className="w-[4.5rem] rounded-md border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-accent"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-accent"
          >
            <option value="rank">Rank</option>
            <option value="points">Points</option>
            <option value="name">Name</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as LimitOption)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] outline-none focus:border-accent"
            aria-label="Number of applications to show"
          >
            <option value={0}>Show all</option>
            <option value={5}>Show 5</option>
            <option value={10}>Show 10</option>
            <option value={25}>Show 25</option>
            <option value={50}>Show 50</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All"],
              ["eligible", "Eligible"],
              ["unestablished", "Unest."],
              ["excluded", "Excluded"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              active={eligibility === value}
              onClick={() => setEligibility(value)}
            >
              {label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", "All tracks"],
              ["7a", "7a"],
              ["7b", "7b"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              active={track === value}
              onClick={() => setTrack(value)}
            >
              {label}
            </Chip>
          ))}
          {(
            [
              ["all", "All findings"],
              ["with", "Has findings"],
              ["clean", "Clean"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={`f-${value}`}
              active={findings === value}
              onClick={() => setFindings(value)}
            >
              {label}
            </Chip>
          ))}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-[11px] text-accent hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[14px] text-muted">No matches.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-[12px] text-accent hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {filtered.map((a, index) => (
              <ShortlistRow
                key={a.applicationId}
                assessment={a}
                index={index}
                selected={a.applicationId === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ol>
        )}
        {limit > 0 && matched.length > filtered.length && (
          <p className="border-t border-border px-4 py-3 text-center font-mono text-[11px] text-muted">
            First {filtered.length} of {matched.length}.{" "}
            <button
              type="button"
              onClick={() => setLimit(0)}
              className="text-accent hover:underline"
            >
              Show all
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
