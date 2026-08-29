"use client";

import { useState } from "react";
import type { Application, BatchResult } from "@/types";
import { logoutAction } from "@/app/actions/auth";
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
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIndex = assessments.findIndex(
    (a) => a.applicationId === selectedId,
  );
  const selected =
    selectedIndex >= 0 ? assessments[selectedIndex] : null;
  const application =
    selected != null ? (applications[selected.applicationId] ?? null) : null;

  function openCompany(id: string) {
    setSelectedId(id);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToList() {
    setView("list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goRelative(delta: number) {
    const next = assessments[selectedIndex + delta];
    if (!next) return;
    openCompany(next.applicationId);
  }

  return (
    <div className="animate-console-in min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight">
              Defensible
            </h1>
            <span className="hidden font-mono text-[10px] tracking-[0.14em] text-muted uppercase sm:inline">
              sequa reviewer
            </span>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted">
            <span className="hidden sm:inline">{reviewerName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="transition hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="pb-16">
        {view === "list" || !selected || !application ? (
          <Shortlist assessments={assessments} onOpen={openCompany} />
        ) : (
          <CompanyReview
            assessment={selected}
            application={application}
            onBack={backToList}
            onPrev={
              selectedIndex > 0 ? () => goRelative(-1) : undefined
            }
            onNext={
              selectedIndex < assessments.length - 1
                ? () => goRelative(1)
                : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
