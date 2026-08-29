import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeProvider";

export function LandingPage() {
  return (
    <div className="landing-root min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="landing-atmosphere" aria-hidden />
      <div className="landing-grid" aria-hidden />
      {/* Full-bleed product plane */}
      <div className="landing-hero-plane" aria-hidden>
        <div className="landing-hero-glow" />
        <div className="landing-hero-sheet">
          <div className="landing-hero-sheet-inner">
            <div className="landing-hero-rule" />
            {[
              { rank: "01", name: "Alem Leather Works PLC", pts: "84", flag: null },
              { rank: "02", name: "Harar Highland Coffee", pts: "79", flag: null },
              { rank: "03", name: "Dire Garments PLC", pts: "75", flag: null },
              {
                rank: "08",
                name: "Abyssinia Metalworks",
                pts: "73",
                flag: "YEARS_VS_HISTORY",
              },
            ].map((row, i) => (
              <div
                key={row.rank}
                className="landing-hero-row"
                style={{ animationDelay: `${0.45 + i * 0.14}s` }}
              >
                <span>{row.rank}</span>
                <span>{row.name}</span>
                <span>{row.pts}</span>
                {row.flag ? <em>{row.flag}</em> : <span />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight transition hover:text-accent md:text-xl"
        >
          Defensible
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-md border border-border bg-surface/80 px-3 py-2 text-[13px] backdrop-blur-sm transition hover:border-accent/40"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero — brand first, one composition */}
      <section className="relative z-10 flex min-h-[calc(100dvh-4.25rem)] flex-col justify-end px-6 pb-16 md:justify-center md:px-10 md:pb-24">
        <div className="mx-auto w-full max-w-6xl">
          <p className="animate-fade-up font-mono text-[11px] tracking-[0.24em] text-accent uppercase">
            Built for sequa · Ethiopia
          </p>
          <h1 className="animate-fade-up-delay-1 mt-4 max-w-[11ch] font-[family-name:var(--font-display)] text-[clamp(3.4rem,11vw,7.5rem)] leading-[0.9] tracking-tight">
            Defensible
          </h1>
          <p className="animate-fade-up-delay-2 mt-6 max-w-lg text-[17px] leading-7 text-muted md:text-[19px]">
            The SME funding shortlist you can defend — ranked, cited, and honest
            about what the form cannot prove.
          </p>
          <div className="animate-fade-up-delay-3 mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-accent px-7 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-110 dark:text-[#06281c]"
            >
              Enter the console
            </Link>
            <a
              href="#product"
              className="text-[14px] text-muted transition hover:text-foreground"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section
        id="product"
        className="relative z-10 border-t border-border/70 bg-surface/40"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:gap-16 md:px-10 md:py-28">
          <div className="animate-fade-up">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              The product
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
              One reviewer. One batch. Zero invented scores.
            </h2>
          </div>
          <p className="animate-fade-up-delay-1 self-end text-[16px] leading-7 text-muted md:text-[17px]">
            Defensible turns sequa SME applications into a ranked shortlist on
            the official evaluation grid. Eligibility and contradictions run in
            code. The model only explains what the fields already show.
          </p>
        </div>
      </section>

      <section className="relative z-10 border-t border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            How reviewers win
          </p>
          <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-10">
            {[
              {
                step: "01",
                title: "Gate, don’t guess",
                body: "Mechanical eligibility from the form. Share companies stay unestablished when ownership is unclear.",
              },
              {
                step: "02",
                title: "Surface the conflict",
                body: "A contradiction engine catches arithmetic and history clashes — including the demo-closing years-vs-history case.",
              },
              {
                step: "03",
                title: "Cite every point",
                body: "Official sequa bands only. Expand a score, tap a field path, read the live application value.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="animate-fade-up"
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <p className="font-mono text-[12px] text-accent">{item.step}</p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-6 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border/70 bg-accent text-white dark:text-[#06281c]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center md:px-10 md:py-20">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
              Ready for the shortlist.
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-6 opacity-90">
              Sign in with the demo access code and open Alem Leather, then
              Abyssinia Metalworks — every score traces to a field.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-md bg-background px-7 py-3.5 text-[15px] font-semibold text-foreground transition hover:opacity-90"
          >
            Open Defensible
          </Link>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-[10px] text-muted md:px-10">
        <Link href="/" className="transition hover:text-foreground">
          Defensible
        </Link>
        <span>sequa gGmbH SME Support Scheme · Challenge 1</span>
      </footer>
    </div>
  );
}
