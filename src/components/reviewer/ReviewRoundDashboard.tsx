import type { Application } from "@/types";
import type { ReviewerIntegritySummary } from "@/lib/reviewerIntegrity";
import { ReviewerAgentRun } from "./ReviewerAgentRun";
import styles from "./ReviewRoundDashboard.module.css";

interface ReviewRoundDashboardProps {
  applications: Application[];
  integrity: ReviewerIntegritySummary;
  runComplete: boolean;
  onRunComplete: () => void;
  onRevealRankings: () => void;
}

function FormsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3.5h7l4 4v13H7v-17Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.5v4h4M10 12h5M10 15.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M4 6.5v14h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function WindowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 9.5h16M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m9.2 14 1.8 1.8 4-4.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="7.3" r="2.7" fill="currentColor" />
      <path d="M6.8 19.5c.4-3.8 2.2-5.7 5.2-5.7s4.8 1.9 5.2 5.7" fill="currentColor" />
      <rect
        x="9.4"
        y="12.6"
        width="5.2"
        height="4.2"
        rx=".7"
        fill="var(--surface)"
        stroke="currentColor"
      />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 20V9h4v11H5Zm5.5 0V4h4v16h-4Zm5.5 0v-7h4v7h-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PIPELINE = [
  "Eligibility gates",
  "Contradiction checks",
  "Official scoring grid",
  "Citation validation",
] as const;

export function ReviewRoundDashboard({
  applications,
  integrity,
  runComplete,
  onRunComplete,
  onRevealRankings,
}: ReviewRoundDashboardProps) {
  const ordered = [...applications].sort((a, b) => a.id.localeCompare(b.id));

  const metrics = [
    {
      label: "Forms submitted",
      value: String(applications.length),
      note: "Loaded into this intake",
      icon: <FormsIcon />,
      tone: "default",
    },
    {
      label: "Submission window",
      value: "Closed",
      note: "No new forms accepted",
      icon: <WindowIcon />,
      tone: "closed",
    },
    {
      label: "Agent review",
      value: runComplete ? "Complete" : "Not run",
      note: runComplete ? "All review tools finished" : `${applications.length} forms queued`,
      icon: <AgentIcon />,
      tone: runComplete ? "complete" : "pending",
    },
    {
      label: "Ranked shortlist",
      value: runComplete ? "Ready" : "Locked",
      note: runComplete ? "Results ready to inspect" : "Unlocks after agent review",
      icon: <RankIcon />,
      tone: runComplete ? "complete" : "locked",
    },
  ];

  return (
    <div className={styles.dashboard}>
      <section className={styles.roundHeader}>
        <div>
          <p className={styles.eyebrow}>Application intake · 2026 review round</p>
          <h1>SME Support Scheme</h1>
          <p className={styles.roundSummary}>
            The submission window is closed. Review the intake status, then run
            the agent to produce the cited shortlist.
          </p>
        </div>
        <div className={styles.roundStatus}>
          <span aria-hidden />
          <div>
            <small>Round status</small>
            <strong>Ready for review</strong>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Round metrics">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`${styles.metricCard} ${styles[`metric_${metric.tone}`]}`}
          >
            <span className={styles.metricIcon}>{metric.icon}</span>
            <div>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <small>{metric.note}</small>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.queuePanel}>
          <header className={styles.panelHeader}>
            <div>
              <p>Submission register</p>
              <h2>Application queue</h2>
            </div>
            <span>{applications.length} received</span>
          </header>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Sector</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((application, index) => (
                  <tr key={application.id}>
                    <td>
                      <span className={styles.submissionNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>
                          {application.companyName ?? "Unnamed application"}
                        </strong>
                        <small>{application.id}</small>
                      </span>
                    </td>
                    <td>{application.businessType ?? "Not provided"}</td>
                    <td>{application.cityRegion ?? "Not provided"}</td>
                    <td>
                      <span className={styles.receivedStatus}>
                        <i aria-hidden />
                        Received
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.agentPanel}>
          <div className={styles.agentHalo} aria-hidden />
          <div className={styles.agentPanelTop}>
            <span className={styles.agentMark}>
              <AgentIcon />
            </span>
            <span className={styles.nextAction}>Next action</span>
          </div>

          <p className={styles.agentKicker}>Defensible reviewer agent</p>
          <h2>
            {runComplete
              ? "The ranked shortlist is ready."
              : `${applications.length} applications are ready for review.`}
          </h2>
          <p className={styles.agentDescription}>
            {runComplete
              ? "The engine has completed every gate, score, finding, and citation check."
              : "One run applies the same deterministic review workflow to every submitted form."}
          </p>

          <ol className={styles.pipeline}>
            {PIPELINE.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
                <i aria-hidden />
              </li>
            ))}
          </ol>

          <div className={styles.agentAction}>
            <ReviewerAgentRun
              initialSummary={integrity}
              triggerVariant="dashboard"
              complete={runComplete}
              onRunComplete={onRunComplete}
              onRevealRankings={onRevealRankings}
            />
          </div>
        </aside>
      </div>

      <section className={styles.roundFlow} aria-label="Review round progress">
        <div className={styles.flowStep}>
          <span className={styles.flowDone}>✓</span>
          <p>
            <strong>Intake opened</strong>
            <small>Forms accepted</small>
          </p>
        </div>
        <i aria-hidden />
        <div className={styles.flowStep}>
          <span className={styles.flowDone}>✓</span>
          <p>
            <strong>{applications.length} forms received</strong>
            <small>Submission register locked</small>
          </p>
        </div>
        <i aria-hidden />
        <div className={styles.flowStep}>
          <span className={styles.flowDone}>✓</span>
          <p>
            <strong>Intake closed</strong>
            <small>Ready for automated review</small>
          </p>
        </div>
        <i aria-hidden />
        <div className={styles.flowStep}>
          <span className={runComplete ? styles.flowDone : styles.flowCurrent}>
            {runComplete ? "✓" : "4"}
          </span>
          <p>
            <strong>{runComplete ? "Agent review complete" : "Run the agent"}</strong>
            <small>{runComplete ? "Shortlist ready" : "Ranking not generated"}</small>
          </p>
        </div>
      </section>
    </div>
  );
}
