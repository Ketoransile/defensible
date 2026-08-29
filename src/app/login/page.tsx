import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (session) redirect("/review");

  return (
    <div className="landing-root flex min-h-dvh flex-col bg-background text-foreground">
      <div className="landing-atmosphere" aria-hidden />
      <div className="landing-grid" aria-hidden />

      <div className="relative z-10 flex justify-end px-6 pt-5">
        <ThemeToggle />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
        <p className="animate-fade-up font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
          Reviewer access
        </p>
        <h1 className="animate-fade-up-delay-1 mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
          Defensible
        </h1>
        <p className="animate-fade-up-delay-2 mt-3 mb-8 max-w-md text-[14px] leading-6 text-muted">
          Sign in to open the ranked, cited shortlist. Scores stay in code —
          never invented by the model.
        </p>
        <div className="animate-fade-up-delay-3">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
