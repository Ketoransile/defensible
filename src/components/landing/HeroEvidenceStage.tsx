import styles from "./LandingPage.module.css";

function ScoreBar({ width }: { width: string }) {
  return (
    <div className={styles.scoreRow}>
      <span className={styles.metricStub} />
      <span className={styles.scoreTrack}>
        <i style={{ width }} />
      </span>
      <span className={styles.metricEnd} />
    </div>
  );
}

export function HeroEvidenceStage() {
  return (
    <figure
      className={styles.evidenceStage}
      aria-label="A ranked application scoring 92 points with traceable citations"
    >
      <div className={styles.stageGlow} aria-hidden />
      <div className={styles.dotField} aria-hidden />

      <div className={styles.arch} aria-hidden>
        <span className={styles.archOrbit} />
      </div>

      <div className={`${styles.reportCard} ${styles.reportCardBackA}`} aria-hidden>
        <span className={styles.backMark} />
        <span className={styles.backLine} />
        <span className={styles.backLineShort} />
      </div>
      <div className={`${styles.reportCard} ${styles.reportCardBackB}`} aria-hidden>
        <span className={styles.backMark} />
        <span className={styles.backLine} />
        <span className={styles.backLineShort} />
      </div>

      <div
        className={`${styles.reportCard} ${styles.reportCardMain}`}
        aria-hidden
      >
        <div className={styles.reportTopline}>
          <span className={styles.rankSeal}>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m7.5 12.2 3 3 6-6.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.reportStatus}>
            <i />
            <i />
            <i />
          </span>
        </div>

        <div className={styles.reportDocument}>
          <div className={styles.reportRuleLong} />
          <div className={styles.reportRuleMedium} />
          <div className={styles.reportRuleShort} />
        </div>

        <div className={styles.scoreRows}>
          <ScoreBar width="92%" />
          <ScoreBar width="84%" />
          <ScoreBar width="100%" />
        </div>

        <div className={styles.citationBlock}>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9.7 14.3 14.3 9.7M8.2 16.6 6.6 18.2a3.3 3.3 0 0 1-4.7-4.7l3-3a3.3 3.3 0 0 1 4.7 0M15.8 7.4l1.6-1.6a3.3 3.3 0 1 1 4.7 4.7l-3 3a3.3 3.3 0 0 1-4.7 0"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <span className={styles.citationLines}>
            <i />
            <i />
          </span>
        </div>
      </div>

      <div className={styles.plant} aria-hidden>
        <svg viewBox="0 0 120 170" fill="none">
          <path
            d="M58 170C59 129 68 77 91 37M62 119C48 96 36 83 19 75M67 98C86 88 98 77 108 59M58 130C43 119 32 113 18 111M74 75C64 62 58 50 58 34"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M90 40C88 24 96 13 111 9C113 25 106 37 90 40ZM70 94C83 78 96 75 111 82C103 97 90 102 70 94ZM60 118C42 102 27 100 14 108C23 123 38 127 60 118ZM57 132C42 119 29 117 18 124C26 138 39 141 57 132ZM57 35C44 22 44 10 51 1C64 9 67 20 57 35ZM45 101C31 84 17 80 4 87C12 103 26 108 45 101Z"
            fill="currentColor"
          />
        </svg>
        <div className={styles.plantPot}>
          <span />
        </div>
      </div>

      <div className={styles.pedestalTop} aria-hidden />
      <div className={styles.pedestalBlock} aria-hidden />
      <div className={styles.pedestalBase} aria-hidden>
        <span />
        <i />
      </div>
    </figure>
  );
}
