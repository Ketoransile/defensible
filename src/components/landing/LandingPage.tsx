import Link from "next/link";

export function LandingPage() {
  return (
    <div className="landing-root min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="landing-atmosphere" aria-hidden />
      <div className="landing-grid" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <p className="font-[family-name:var(--font-display)] text-lg tracking-tight md:text-xl">
          Defensible
        </p>
        <Link
          href="/login"
          className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition hover:text-accent"
        >
          Sign in
        </Link>
      </header>

      <section className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] flex-col justify-end px-6 pb-16 md:justify-center md:px-10 md:pb-24">
        <div className="max-w-3xl">
          <p className="animate-fade-up font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
            sequa SME Support Scheme · Ethiopia
          </p>
          <h1 className="animate-fade-up-delay-1 mt-4 font-[family-name:var(--font-display)] text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-tight">
            Defensible
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-[17px] leading-7 text-foreground/80 md:text-[18px]">
            A ranked shortlist you can interrogate — every score cites a field,
            every contradiction is shown, and gaps stay unestablished.
          </p>
          <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-sm bg-accent px-6 py-3 text-[14px] font-semibold text-[#06281c] transition hover:brightness-110"
            >
              Open the reviewer
            </Link>
            <span className="font-mono text-[11px] text-muted">
              Access code on the next screen
            </span>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-y-10 right-0 hidden w-[46%] lg:block"
          aria-hidden
        >
          <div className="landing-rank-panel animate-float-slow mr-10 h-full max-h-[34rem] overflow-hidden rounded-sm border border-border/80 bg-surface/70 p-4 backdrop-blur-sm">
            <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Live shortlist preview
            </p>
            {[
              ["01", "Alem Leather Works", "84", "7b"],
              ["02", "Harar Coffee Export", "79", "7a"],
              ["03", "Dire Garments", "75", "7b"],
              ["08", "Abyssinia Metalworks", "73", "7b"],
            ].map((row, i) => (
              <div
                key={row[0]}
                className="landing-rank-row mb-2 flex items-center gap-3 border border-border/50 bg-background/50 px-3 py-2.5"
                style={{ animationDelay: `${0.35 + i * 0.12}s` }}
              >
                <span className="w-6 font-mono text-[11px] text-muted">{row[0]}</span>
                <span className="flex-1 text-[13px]">{row[1]}</span>
                <span className="font-mono text-[12px] text-accent">{row[2]}</span>
                <span className="font-mono text-[10px] text-info">{row[3]}</span>
              </div>
            ))}
            <p className="mt-3 font-mono text-[10px] leading-4 text-warn">
              #08 carries YEARS_VS_HISTORY — strong on the grid, then the history
              lands.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border/70 px-6 py-16 md:px-10">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          Why judges can trust it
        </p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {[
            {
              title: "Eligibility first",
              body: "Mechanical gates from the form. Share companies stay unestablished when ownership is unclear — we refuse to guess.",
            },
            {
              title: "Contradiction engine",
              body: "Arithmetic and cross-field checks in plain TypeScript. Conflicting values sit side by side with field paths.",
            },
            {
              title: "Cited scores only",
              body: "Official sequa bands. Click any criterion, see the live application field. Nothing renders without a citation.",
            },
          ].map((item) => (
            <div key={item.title} className="max-w-sm">
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                {item.title}
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-6 py-5 font-mono text-[10px] text-muted md:px-10">
        <span>Hackathon Challenge 1 · sequa gGmbH SME Support Scheme</span>
        <Link href="/login" className="text-accent hover:underline">
          Enter console →
        </Link>
      </footer>
    </div>
  );
}
