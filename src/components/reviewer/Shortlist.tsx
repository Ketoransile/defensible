"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Assessment, EligibilityVerdict } from "@/types";
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

type EligibilityFilter = "all" | EligibilityVerdict;
type TrackFilter = "all" | "7a" | "7b";
type FindingsFilter = "all" | "with" | "clean";
type SortKey = "rank" | "points" | "name";

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
        "rounded-full border px-3 py-1 text-[12px] transition",
        active
          ? "border-accent bg-accent-dim text-accent"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function Shortlist({ assessments, onOpen }: ShortlistProps) {
  const [query, setQuery] = useState("");
  const [eligibility, setEligibility] = useState<EligibilityFilter>("all");
  const [track, setTrack] = useState<TrackFilter>("all");
  const [findings, setFindings] = useState<FindingsFilter>("all");
  const [rankMin, setRankMin] = useState("");
  const [rankMax, setRankMax] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");

  const filtered = useMemo(() => {
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
        const hay = `${a.companyName ?? ""} ${a.applicationId} ${a.brief.headline}`.toLowerCase();
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

  const hasFilters =
    query !== "" ||
    eligibility !== "all" ||
    track !== "all" ||
    findings !== "all" ||
    rankMin !== "" ||
    rankMax !== "" ||
    sort !== "rank";

  function clearFilters() {
    setQuery("");
    setEligibility("all");
    setTrack("all");
    setFindings("all");
    setRankMin("");
    setRankMax("");
    setSort("rank");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            Shortlist · {filtered.length} of {assessments.length} shown
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
            Ranked applicants
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted">
            Filter the ranked list, then open a company to inspect scores and
            source fields.
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or headline…"
            className="w-full flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-[14px] outline-none transition focus:border-accent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="font-mono text-[11px] text-muted">Ranks</label>
            <input
              type="number"
              min={1}
              value={rankMin}
              onChange={(e) => setRankMin(e.target.value)}
              placeholder="From"
              className="w-20 rounded-md border border-border bg-background px-2 py-2 text-[13px] outline-none focus:border-accent"
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              min={1}
              value={rankMax}
              onChange={(e) => setRankMax(e.target.value)}
              placeholder="To"
              className="w-20 rounded-md border border-border bg-background px-2 py-2 text-[13px] outline-none focus:border-accent"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
            >
              <option value="rank">Sort: rank</option>
              <option value="points">Sort: points</option>
              <option value="name">Sort: name</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="self-center font-mono text-[10px] tracking-wider text-muted uppercase">
            Eligibility
          </span>
          {(
            [
              ["all", "All"],
              ["eligible", "Eligible"],
              ["unestablished", "Unestablished"],
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

        <div className="flex flex-wrap gap-2">
          <span className="self-center font-mono text-[10px] tracking-wider text-muted uppercase">
            Track
          </span>
          {(
            [
              ["all", "All"],
              ["7a", "7a Employability"],
              ["7b", "7b Investment"],
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="self-center font-mono text-[10px] tracking-wider text-muted uppercase">
            Findings
          </span>
          {(
            [
              ["all", "All"],
              ["with", "Has findings"],
              ["clean", "Clean only"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
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
              className="ml-auto text-[12px] text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-[15px] text-muted">
            No applications match these filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-[13px] text-accent hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {filtered.map((a, index) => {
            const excluded = a.eligibility.verdict === "excluded";
            return (
              <li
                key={a.applicationId}
                className="animate-list-in"
                style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
              >
                <button
                  type="button"
                  onClick={() => onOpen(a.applicationId)}
                  className={[
                    "group flex h-full w-full flex-col gap-4 rounded-xl border border-border bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md",
                    excluded ? "opacity-80" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] text-muted">
                        Official rank {excluded ? "—" : `#${a.rank}`}
                        {hasFilters ? ` · filtered #${index + 1}` : ""}
                      </p>
                      <p className="mt-1 truncate text-[18px] font-semibold tracking-tight">
                        {a.companyName ?? a.applicationId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl tabular-nums">
                        {a.totalPoints}
                        <span className="text-sm text-muted">
                          /{a.maxAvailablePoints}
                        </span>
                      </p>
                      <p className="font-mono text-[11px] text-muted">
                        {formatPct(a.confidence)} est.
                      </p>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-[13px] leading-5 text-muted">
                    {a.brief.headline}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 text-[12px]">
                    <span className={eligibilityTone(a.eligibility.verdict)}>
                      {eligibilityLabel(a.eligibility.verdict)}
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-info">{trackLabel(a)}</span>
                    {a.findings.slice(0, 2).map((f, i) => (
                      <span
                        key={`${f.checkId}-${i}`}
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${findingTone(f.severity)}`}
                      >
                        {f.checkId}
                      </span>
                    ))}
                    <span className="ml-auto rounded-md border border-border px-3 py-1.5 text-[12px] text-accent transition group-hover:border-accent/50 group-hover:bg-accent-dim">
                      Review →
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
