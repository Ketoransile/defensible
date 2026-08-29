"use client";

import { getField } from "@/lib/fields";
import type { Application, FieldPath } from "@/types";
import { formatFieldValue } from "./format";

interface CitationInspectorProps {
  application: Application;
  path: FieldPath | null;
  onClose: () => void;
}

export function CitationInspector({
  application,
  path,
  onClose,
}: CitationInspectorProps) {
  if (!path) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
        <div className="shrink-0 border-b border-border px-3 py-2">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            Field inspector
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 text-center">
          <p className="max-w-[16rem] text-[12px] leading-5 text-muted">
            Click a citation on a criterion to show the live value from this
            application.
          </p>
        </div>
      </div>
    );
  }

  const value = getField(application, path);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            Field inspector
          </p>
          <p className="mt-1 break-all font-mono text-[12px] text-accent">
            {path}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 font-mono text-[11px] text-muted hover:text-foreground"
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3">
        <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-foreground">
          {formatFieldValue(value)}
        </pre>
      </div>
      <div className="shrink-0 border-t border-border px-3 py-2 font-mono text-[10px] text-muted">
        Resolved via getField(application, path) — not model text
      </div>
    </div>
  );
}
