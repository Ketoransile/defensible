"use client";

import { useState } from "react";
import type { Application, FieldPath, Finding } from "@/types";
import { FieldInspect } from "./FieldInspect";
import { checkLabel, fieldLabel } from "./fieldDisplay";
import { findingSides, type FindingSide } from "./findingSides";
import { findingTone } from "./format";

function SideCell({
  side,
  active,
  onSelect,
  closer,
}: {
  side: FindingSide;
  active: boolean;
  onSelect: (path: FieldPath) => void;
  closer: boolean;
}) {
  const clickable = Boolean(side.path);
  const inner = (
    <>
      <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
        {side.eyebrow}
      </span>
      <span
        className={[
          "mt-2 block font-mono font-semibold tracking-tight tabular-nums",
          closer ? "text-[2rem] leading-none sm:text-[2.35rem]" : "text-[1.65rem] leading-none",
        ].join(" ")}
      >
        {side.value}
      </span>
      <span className="mt-2 block text-[13px] leading-5 text-muted">
        {side.caption}
      </span>
      {side.path ? (
        <span className="mt-2 block truncate text-[12px] text-info">
          {fieldLabel(side.path)}
        </span>
      ) : (
        <span className="mt-2 block text-[12px] text-muted">Scheme rule</span>
      )}
    </>
  );

  const box = [
    "min-w-0 rounded-md border p-4 text-left transition",
    closer ? "border-warn/40 bg-warn/5" : "border-border bg-surface-2/40",
    active ? "border-accent bg-accent-dim ring-1 ring-accent/30" : "",
    clickable ? "hover:border-accent/50" : "",
  ].join(" ");

  if (!side.path) {
    return <div className={box}>{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(side.path!)}
      aria-pressed={active}
      className={box}
    >
      {inner}
    </button>
  );
}

export function FindingBlock({
  finding,
  application,
}: {
  finding: Finding;
  application: Application;
}) {
  const duel = findingSides(finding, application);
  const closer = finding.checkId === "YEARS_VS_HISTORY";
  const [inspectPath, setInspectPath] = useState<FieldPath | null>(null);

  function toggle(path: FieldPath) {
    setInspectPath((prev) => (prev === path ? null : path));
  }

  return (
    <div
      className={[
        "rounded-md border bg-background p-3 sm:p-4",
        closer ? "border-warn/45" : "border-border",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${findingTone(finding.severity)}`}
        >
          {finding.severity}
        </span>
        <span className="text-[12px] text-muted">{checkLabel(finding.checkId)}</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold tracking-tight">{finding.title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted">{finding.explanation}</p>

      {duel ? (
        <div className="finding-duel mt-4 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
          <SideCell
            side={duel.left}
            active={inspectPath === duel.left.path}
            onSelect={toggle}
            closer={closer}
          />
          <p
            className="self-center text-center font-mono text-[11px] tracking-[0.18em] text-muted uppercase sm:px-1"
            aria-hidden
          >
            vs
          </p>
          <SideCell
            side={duel.right}
            active={inspectPath === duel.right.path}
            onSelect={toggle}
            closer={closer}
          />
        </div>
      ) : finding.fields.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {finding.fields.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => toggle(path)}
              className={[
                "rounded-sm border px-2.5 py-1.5 text-[12px]",
                inspectPath === path
                  ? "border-accent bg-accent-dim text-accent"
                  : "border-border text-foreground/80",
              ].join(" ")}
            >
              {fieldLabel(path)}
            </button>
          ))}
        </div>
      ) : null}

      {inspectPath ? (
        <FieldInspect path={inspectPath} application={application} />
      ) : duel ? (
        <p className="mt-3 font-mono text-[10px] tracking-wider text-muted uppercase">
          Tap a value to read the form answer
        </p>
      ) : null}
    </div>
  );
}
