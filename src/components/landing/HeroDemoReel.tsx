"use client";

import { useEffect, useState } from "react";

const ROWS = [
  {
    rank: "01",
    name: "Alem Leather Works PLC",
    pts: "84",
    track: "7b",
    flag: null as string | null,
  },
  {
    rank: "02",
    name: "Harar Highland Coffee",
    pts: "79",
    track: "7a",
    flag: null,
  },
  {
    rank: "03",
    name: "Dire Garments PLC",
    pts: "75",
    track: "7b",
    flag: null,
  },
  {
    rank: "08",
    name: "Abyssinia Metalworks",
    pts: "73",
    track: "7b",
    flag: "YEARS_VS_HISTORY",
  },
] as const;

const CYCLE_MS = 2200;

/**
 * Looping product demo on the landing hero — reads like a silent product video.
 */
export function HeroDemoReel() {
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<"scan" | "hold" | "flag">("scan");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setActive(3);
      setPhase("flag");
      return;
    }

    let step = 0;
    const id = window.setInterval(() => {
      step = (step + 1) % (ROWS.length + 2);
      if (step < ROWS.length) {
        setActive(step);
        setPhase("hold");
      } else if (step === ROWS.length) {
        setActive(3);
        setPhase("flag");
      } else {
        setActive(0);
        setPhase("scan");
      }
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, []);

  const current = ROWS[active];

  return (
    <div className="landing-hero-sheet landing-hero-sheet--live" aria-hidden>
      <div className="landing-hero-chrome">
        <span className="landing-hero-dot" />
        <span className="landing-hero-dot" />
        <span className="landing-hero-dot" />
        <span className="landing-hero-chrome-label">Live shortlist</span>
        <span className="landing-hero-rec">
          <i /> REC
        </span>
      </div>

      <div className="landing-hero-sheet-inner">
        <div className="landing-hero-scan" />
        <div className="landing-hero-rule" />
        <div className="landing-hero-cols">
          <span>#</span>
          <span>Company</span>
          <span>Pts</span>
          <span>Track</span>
        </div>

        {ROWS.map((row, i) => (
          <div
            key={row.rank}
            className={[
              "landing-hero-row",
              i === active ? "is-active" : "",
              row.flag && phase === "flag" && i === active ? "is-flagged" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ animationDelay: `${0.35 + i * 0.12}s` }}
          >
            <span>{row.rank}</span>
            <span>{row.name}</span>
            <span className="landing-hero-pts">{row.pts}</span>
            <span className="landing-hero-track">{row.track}</span>
          </div>
        ))}

        <div
          className={[
            "landing-hero-caption",
            phase === "flag" ? "is-visible" : "",
          ].join(" ")}
        >
          {phase === "flag" ? (
            <>
              <strong>{current.name}</strong> scores well — then{" "}
              <em>{current.flag}</em> lands.
            </>
          ) : (
            <>
              Reviewing rank {current.rank} · {current.pts} established points
            </>
          )}
        </div>
      </div>
    </div>
  );
}
