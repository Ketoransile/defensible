"use client";

import Link from "next/link";
import { useState } from "react";
import type { Application, BatchResult } from "@/types";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { CompanyReview } from "./CompanyReview";
import { Shortlist } from "./Shortlist";

interface ReviewerAppProps {
  batch: BatchResult;
  applications: Record<string, Application>;
  reviewerName: string;
}

export function ReviewerApp({
  batch,
  applications,
  reviewerName,
}: ReviewerAppProps) {
  const assessments = batch.assessments;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIndex = assessments.findIndex(
    (a) => a.applicationId === selectedId,
  );
  const selected = selectedIndex >= 0 ? assessments[selectedIndex] : null;
  const application =
    selected != null ? (applications[selected.applicationId] ?? null) : null;
  const detailOpen = selected != null && application != null;

  function selectCompany(id: string) {
    setSelectedId(id);
  }

  function closeDetail() {
    setSelectedId(null);
  }

  function goRelative(delta: number) {
    const next = assessments[selectedIndex + delta];
    if (!next) return;
    setSelectedId(next.applicationId);
  }

  return (
    <div className="animate-console-in flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="z-20 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-tight transition hover:text-accent"
            >
              Defensible
            </Link>
            <span className="hidden font-mono text-[10px] tracking-[0.14em] text-muted uppercase sm:inline">
              sequa reviewer
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted sm:gap-3">
            <span className="hidden md:inline">{reviewerName}</span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] transition hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        {/* Ranked list — full width on mobile until a row is opened */}
        <aside
          className={[
            "flex min-h-0 flex-col border-border bg-surface",
            detailOpen
              ? "hidden w-full max-w-md border-r lg:flex lg:w-[min(420px,38%)] lg:shrink-0"
              : "flex w-full lg:w-[min(420px,38%)] lg:shrink-0 lg:border-r",
          ].join(" ")}
        >
          <Shortlist
            assessments={assessments}
            selectedId={selectedId}
            onSelect={selectCompany}
          />
        </aside>

        {/* Detail expands on the right with motion */}
        <section
          className={[
            "relative min-h-0 min-w-0 flex-1 overflow-hidden bg-background",
            detailOpen ? "flex flex-col" : "hidden lg:flex",
          ].join(" ")}
        >
          {detailOpen ? (
            <div
              key={selected.applicationId}
              className="review-detail-panel flex h-full min-h-0 flex-1 flex-col overflow-hidden"
            >
              <CompanyReview
                assessment={selected}
                application={application}
                variant="panel"
                onBack={closeDetail}
                onPrev={
                  selectedIndex > 0 ? () => goRelative(-1) : undefined
                }
                onNext={
                  selectedIndex < assessments.length - 1
                    ? () => goRelative(1)
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                Company review
              </p>
              <p className="mt-3 max-w-sm font-[family-name:var(--font-display)] text-2xl tracking-tight">
                Select a ranked applicant
              </p>
              <p className="mt-2 max-w-sm text-[14px] leading-6 text-muted">
                Details expand here — scores, findings, and source fields for
                the company you pick on the left.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
