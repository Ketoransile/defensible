import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { HeroEvidenceStage } from "./HeroEvidenceStage";
import { LandingHeader } from "./LandingHeader";
import { Reveal } from "./Reveal";
import styles from "./LandingPage.module.css";

function BrandMark() {
  return (
    <svg
      className={styles.brandMark}
      viewBox="0 0 28 32"
      fill="none"
      aria-hidden
    >
      <path d="M3 9.5 12.5 4v10.5L3 20V9.5Z" fill="currentColor" opacity=".72" />
      <path d="m15 2 10 5.7-10 5.7V2Z" fill="currentColor" />
      <path d="m3 22.4 9.5-5.5v11L3 22.4Z" fill="currentColor" />
      <path d="m15 15.4 10-5.7v11.6L15 27V15.4Z" fill="currentColor" opacity=".9" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 19 6v5.1c0 4.5-2.8 7.8-7 9.9-4.2-2.1-7-5.4-7-9.9V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5.5"
        y="10"
        width="13"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7.7a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TRUST: Array<{
  title: string;
  body: string;
  icon: ReactNode;
}> = [
  {
    title: "Transparency first",
    body: "Every score is explained and traceable.",
    icon: <ShieldIcon />,
  },
  {
    title: "Secure by design",
    body: "Application data stays private and protected.",
    icon: <LockIcon />,
  },
  {
    title: "Grounded AI agent",
    body: "Ask why any rank, finding, or gap exists.",
    icon: <CheckIcon />,
  },
];

const STEPS = [
  {
    number: "01",
    title: "Gate and detect",
    body: "Apply the programme’s eligibility rules and surface contradictions before ranking.",
  },
  {
    number: "02",
    title: "Score and cite",
    body: "Apply official bands in code and attach the exact form evidence behind every point.",
  },
  {
    number: "03",
    title: "Ask the agent",
    body: "Interrogate one selected file in plain language without letting the model invent a score.",
  },
];

const PROOF = [
  {
    title: "The agent explains; code decides",
    body: "Gemini briefs the reviewer. Deterministic code owns every score, gate, and finding.",
    icon: <CheckIcon />,
  },
  {
    title: "Honest about gaps",
    body: "Missing evidence stays unestablished. It is never silently converted into a zero.",
    icon: <ShieldIcon />,
  },
  {
    title: "Private application data",
    body: "Reviewers interrogate one selected file at a time, inside the protected console.",
    icon: <LockIcon />,
  },
];

export function LandingPage() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      <LandingHeader>
        <div className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Defensible home">
            <BrandMark />
            <span>Defensible</span>
          </Link>

          <nav className={styles.nav} aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#why-defensible">Why Defensible</a>
            <a href="#for-reviewers">For Reviewers</a>
            <a href="#security">Security</a>
          </nav>

          <div className={styles.headerActions}>
            <ThemeToggle className={styles.themeToggle} />
            <Link href="/login" className={styles.signIn}>
              Sign in
            </Link>
          </div>
        </div>
      </LandingHeader>

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>
                <i aria-hidden />
                AI reviewer agent · Built for sequa
              </p>

              <h1 className={styles.title}>
                Fund what works. <em>Defend</em> every decision.
              </h1>

              <p className={styles.subtitle}>
                Defensible is a grounded AI reviewer agent that turns forms into
                a ranked shortlist with transparent scores and citations—so you
                can choose with confidence.
              </p>

              <div className={styles.heroActions}>
                <Link href="/login" className={styles.primaryAction}>
                  Enter the console
                  <ArrowRight />
                </Link>
                <a href="#how-it-works" className={styles.secondaryAction}>
                  See how it works
                  <span aria-hidden>›</span>
                </a>
              </div>

              <div className={styles.trustGrid}>
                {TRUST.map((item) => (
                  <div key={item.title} className={styles.trustItem}>
                    <span className={styles.trustIcon}>{item.icon}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.visualColumn}>
              <HeroEvidenceStage />
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.contentSection}>
          <div className={styles.sectionInner}>
            <Reveal>
              <p className={styles.sectionLabel}>How it works</p>
              <h2 className={styles.sectionTitle}>
                From submitted form to defensible shortlist.
              </h2>
            </Reveal>

            <div className={styles.steps}>
              {STEPS.map((step, index) => (
                <Reveal key={step.number} delayMs={index * 90}>
                  <article className={styles.step}>
                    <span>{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="why-defensible" className={styles.proofSection}>
          <div className={styles.proofInner}>
            <Reveal>
              <p className={styles.sectionLabel}>Why Defensible</p>
              <h2 className={styles.sectionTitle}>
                Evidence before confidence.
              </h2>
            </Reveal>

            <div className={styles.proofList}>
              {PROOF.map((item, index) => (
                <Reveal key={item.title} delayMs={index * 80}>
                  <article
                    id={item.title === "Private application data" ? "security" : undefined}
                    className={styles.proofRow}
                  >
                    {item.icon}
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="for-reviewers" className={styles.reviewerSection}>
          <Reveal>
            <div className={styles.reviewerCard}>
              <div>
                <h2>One reviewer. One batch. Every point explained.</h2>
                <p>
                  Open the ranked demo, inspect the clean shortlist lead, then
                  reveal the history contradiction that changes the review.
                </p>
              </div>
              <Link href="/login" className={styles.reviewerCta}>
                Open Defensible
                <ArrowRight />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Defensible · sequa SME reviewer</span>
        <span>Ranked. Cited. Interrogable.</span>
      </footer>
    </div>
  );
}
