"use client";

import { useState } from "react";
import type { Application, Assessment, BatchResult, FieldPath } from "@/types";
import { BatchView } from "./BatchView";
import { CitationInspector } from "./CitationInspector";
import { CompanyDetail } from "./CompanyDetail";
import { ResizableSplit } from "./ResizableSplit";
import { formatPct } from "./format";

interface ReviewerAppProps {
  batch: BatchResult;
  applications: Record<string, Application>;
}

export function ReviewerApp({ batch, applications }: ReviewerAppProps) {
  const assessments = batch.assessments;
  const [selectedId, setSelectedId] = useState<string | null>(
    assessments[0]?.applicationId ?? null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<FieldPath | null>(null);

  const selected: Assessment | null =
    assessments.find((a) => a.applicationId === selectedId) ??
    assessments[0] ??
    null;

  const application =
    selected != null ? (applications[selected.applicationId] ?? null) : null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setExpandedId(null);
    setActiveCitation(null);
  }

  function handleToggle(criterionId: string) {
    setExpandedId((prev) => (prev === criterionId ? null : criterionId));
  }

  const detailPane =
    selected && application ? (
      <CompanyDetail
        assessment={selected}
        application={application}
        expandedId={expandedId}
        onToggle={handleToggle}
        activeCitation={activeCitation}
        onCitationClick={setActiveCitation}
      />
    ) : (
      <div className="flex h-full items-center justify-center bg-background text-muted">
        Select an application
      </div>
    );

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[15px] font-semibold tracking-tight">
            sequa SME Reviewer
          </h1>
          <span className="hidden font-mono text-[10px] tracking-[0.16em] text-muted uppercase sm:inline">
            Operator console
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
          <span>{assessments.length} apps</span>
          <span className="hidden md:inline">
            {new Date(batch.generatedAt).toLocaleString()}
          </span>
          <span className="rounded border border-accent/30 bg-accent-dim px-1.5 py-0.5 text-accent">
            Cited scores only
          </span>
        </div>
      </header>

      <div className="hidden min-h-0 flex-1 overflow-hidden lg:block">
        <ResizableSplit
          axis="horizontal"
          initial={36}
          min={22}
          max={55}
          storageKey="sequa-split-batch-main"
          first={
            <div className="h-full bg-surface">
              <BatchView
                assessments={assessments}
                selectedId={selected?.applicationId ?? null}
                onSelect={handleSelect}
              />
            </div>
          }
          second={
            <ResizableSplit
              axis="horizontal"
              initial={70}
              min={45}
              max={88}
              storageKey="sequa-split-detail-inspector"
              first={detailPane}
              second={
                application ? (
                  <CitationInspector
                    application={application}
                    path={activeCitation}
                    onClose={() => setActiveCitation(null)}
                  />
                ) : (
                  <div className="h-full bg-surface" />
                )
              }
            />
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain lg:hidden">
        <section className="h-[40vh] shrink-0 overflow-hidden border-b border-border">
          <BatchView
            assessments={assessments}
            selectedId={selected?.applicationId ?? null}
            onSelect={handleSelect}
          />
        </section>
        <section className="h-[48vh] shrink-0 overflow-hidden border-b border-border">
          {detailPane}
        </section>
        <section className="h-[32vh] shrink-0 overflow-hidden">
          {application ? (
            <CitationInspector
              application={application}
              path={activeCitation}
              onClose={() => setActiveCitation(null)}
            />
          ) : null}
        </section>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-4 py-1.5 font-mono text-[10px] text-muted">
        <span>Official sequa grid · click a citation to inspect the field</span>
        {selected && (
          <span>
            #{selected.rank} {selected.companyName ?? selected.applicationId} ·{" "}
            {selected.totalPoints}/{selected.maxAvailablePoints} ·{" "}
            {formatPct(selected.confidence)} established
          </span>
        )}
      </footer>
    </div>
  );
}
