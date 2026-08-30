"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ReviewerIntegritySummary } from "@/lib/reviewerIntegrity";
import styles from "./ReviewerAgentRun.module.css";

interface AgentRunStep {
  id: string;
  title: string;
  detail: string;
  metric: string;
  tone?: "success" | "danger";
}

interface ReviewerAgentRunProps {
  initialSummary: ReviewerIntegritySummary;
  triggerVariant?: "header" | "dashboard";
  complete?: boolean;
  onRunComplete?: () => void;
  onRevealRankings: () => void;
}

function AgentGlyph({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={compact ? styles.agentGlyphCompact : styles.agentGlyph}
      aria-hidden
    >
      <svg viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="8.2" r="3.1" fill="currentColor" />
        <path
          d="M7.5 22.5c.5-4.2 2.8-6.3 6.5-6.3s6 2.1 6.5 6.3"
          fill="currentColor"
        />
        <rect
          x="11.3"
          y="14.7"
          width="5.4"
          height="4.5"
          rx=".7"
          fill="var(--surface)"
          stroke="currentColor"
        />
      </svg>
    </span>
  );
}

function StepCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="m5.5 10.2 2.8 2.8 6.2-6.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

async function streamAgentRun(params: {
  signal: AbortSignal;
  onStep: (step: AgentRunStep) => void;
  onDone: (summary: ReviewerIntegritySummary) => void;
}) {
  const response = await fetch("/api/reviewer-run", {
    method: "GET",
    headers: { Accept: "text/event-stream" },
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(`Agent run failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Agent run returned no stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (!params.signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const data = event
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (!data) continue;

      const payload = JSON.parse(data.slice(6)) as
        | { type: "step"; step: AgentRunStep }
        | { type: "done"; summary: ReviewerIntegritySummary }
        | { type: "error"; text: string };

      if (payload.type === "step") params.onStep(payload.step);
      if (payload.type === "done") params.onDone(payload.summary);
      if (payload.type === "error") throw new Error(payload.text);
    }
  }
}

export function IntegrityStrip({
  summary,
}: {
  summary: ReviewerIntegritySummary;
}) {
  const allValid =
    summary.citations > 0 && summary.invalidCitations === 0;

  return (
    <div className={styles.integrityStrip} aria-label="Assessment integrity">
      <div className={styles.integrityLead}>
        <span className={styles.integrityPulse} aria-hidden />
        <span>
          <strong>Trace integrity</strong>
          <small>{allValid ? "All checks passed" : "Review required"}</small>
        </span>
      </div>
      <span className={styles.integrityDivider} aria-hidden />
      <div className={styles.integrityMetric}>
        <strong>{summary.applications}</strong>
        <span>applications</span>
      </div>
      <div className={styles.integrityMetric}>
        <strong>{summary.criteriaEvaluated}</strong>
        <span>criteria evaluated</span>
      </div>
      <div className={styles.integrityMetric}>
        <strong>
          {summary.validCitations}/{summary.citations}
        </strong>
        <span>citation paths valid</span>
      </div>
      <div className={`${styles.integrityMetric} ${styles.integrityPromise}`}>
        <strong>{summary.aiScoredPoints}</strong>
        <span>AI-scored points</span>
      </div>
    </div>
  );
}

export function ReviewerAgentRun({
  initialSummary,
  triggerVariant = "header",
  complete = false,
  onRunComplete,
  onRevealRankings,
}: ReviewerAgentRunProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "running" | "done" | "error"
  >(() => (complete ? "done" : "idle"));
  const [steps, setSteps] = useState<AgentRunStep[]>([]);
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function closeDialog() {
    abortRef.current?.abort();
    abortRef.current = null;
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  async function runAgent() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSteps([]);
    setError(null);
    setStatus("running");

    try {
      await streamAgentRun({
        signal: controller.signal,
        onStep: (step) => {
          setSteps((current) => {
            if (current.some((item) => item.id === step.id)) return current;
            return [...current, step];
          });
        },
        onDone: (nextSummary) => {
          setSummary(nextSummary);
          setStatus("done");
          onRunComplete?.();
        },
      });
    } catch (runError) {
      if (controller.signal.aborted) return;
      setError(
        runError instanceof Error
          ? runError.message
          : "The reviewer agent could not complete this run.",
      );
      setStatus("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function openAndRun() {
    if (status === "done") {
      onRevealRankings();
      return;
    }
    setOpen(true);
    void runAgent();
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function revealRankings() {
    closeDialog();
    onRevealRankings();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={[
          styles.runTrigger,
          triggerVariant === "dashboard" ? styles.runTriggerDashboard : "",
        ].join(" ")}
        onClick={openAndRun}
      >
        <AgentGlyph compact />
        <span>
          {status === "done"
            ? "Reveal ranked shortlist"
            : triggerVariant === "dashboard"
              ? "Run the Agent"
              : "Run reviewer agent"}
        </span>
        <i aria-hidden />
      </button>

      {open ? (
        <div className={styles.overlay}>
          <button
            type="button"
            className={styles.backdrop}
            onClick={closeDialog}
            aria-label="Close agent run"
          />
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-run-title"
            onKeyDown={handleDialogKeyDown}
          >
            <header className={styles.dialogHeader}>
              <div className={styles.agentIdentity}>
                <AgentGlyph />
                <span>
                  <small>Defensible agent</small>
                  <strong id="agent-run-title">Reviewer run</strong>
                </span>
              </div>
              <button
                ref={closeRef}
                type="button"
                className={styles.closeButton}
                onClick={closeDialog}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <div className={styles.dialogBody}>
              <div className={styles.runIntro}>
                <div>
                  <p className={styles.runKicker}>
                    {status === "done"
                      ? "Run complete"
                      : status === "error"
                        ? "Run interrupted"
                        : "Live engine activity"}
                  </p>
                  <h2
                    className={
                      status === "done" ? styles.runTitleComplete : undefined
                    }
                  >
                    {status === "done"
                      ? "The shortlist is ready to defend."
                      : "Building the defensible shortlist."}
                  </h2>
                </div>
                <span
                  className={[
                    styles.runState,
                    status === "done" ? styles.runStateDone : "",
                    status === "error" ? styles.runStateError : "",
                  ].join(" ")}
                >
                  <i aria-hidden />
                  {status === "done"
                    ? "Complete"
                    : status === "error"
                      ? "Stopped"
                      : "Running"}
                </span>
              </div>

              <ol className={styles.stepList} aria-live="polite">
                {steps.map((step, index) => (
                  <li
                    key={step.id}
                    className={styles.step}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <span
                      className={[
                        styles.stepIcon,
                        step.tone === "danger" ? styles.stepIconDanger : "",
                      ].join(" ")}
                    >
                      <StepCheck />
                    </span>
                    <span className={styles.stepCopy}>
                      <strong>{step.title}</strong>
                      <small>{step.detail}</small>
                    </span>
                    <span className={styles.stepMetric}>{step.metric}</span>
                  </li>
                ))}
                {status === "running" ? (
                  <li className={`${styles.step} ${styles.stepActive}`}>
                    <span className={styles.stepSpinner} aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className={styles.stepCopy}>
                      <strong>Agent working</strong>
                      <small>Running deterministic review tools…</small>
                    </span>
                  </li>
                ) : null}
              </ol>

              {status === "done" ? (
                <div className={styles.runSummary}>
                  <div>
                    <strong>{summary.applications}</strong>
                    <span>files ranked</span>
                  </div>
                  <div>
                    <strong>{summary.findings}</strong>
                    <span>findings surfaced</span>
                  </div>
                  <div>
                    <strong>
                      {summary.validCitations}/{summary.citations}
                    </strong>
                    <span>citations resolve</span>
                  </div>
                  <div>
                    <strong>0</strong>
                    <span>points invented</span>
                  </div>
                </div>
              ) : null}

              {error ? <p className={styles.runError}>{error}</p> : null}
            </div>

            <footer className={styles.dialogFooter}>
              <p>
                <span aria-hidden>●</span> The agent explains. Code decides.
              </p>
              <div>
                {status === "error" ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => void runAgent()}
                  >
                    Try again
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={revealRankings}
                  disabled={status !== "done"}
                >
                  Reveal ranked shortlist
                  <span aria-hidden>→</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
