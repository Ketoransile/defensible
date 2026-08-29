"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

/** Shown on the form so judges can sign in without a real account. */
export const DEMO_PASSWORD_HINT = "defensible";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const passwordRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="mx-auto w-full max-w-md space-y-5">
      <p className="rounded-md border border-border bg-surface/80 px-3 py-2.5 text-[12px] leading-5 text-muted">
        Simulated sign-in for the hackathon. Use any username. Password:{" "}
        <span className="font-mono text-accent">{DEMO_PASSWORD_HINT}</span>
      </p>

      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block font-mono text-[11px] tracking-[0.16em] text-muted uppercase"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          placeholder="Any name works"
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-foreground outline-none transition focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block font-mono text-[11px] tracking-[0.16em] text-muted uppercase"
        >
          Password
        </label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder={DEMO_PASSWORD_HINT}
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5 font-mono text-[14px] text-foreground outline-none transition focus:border-accent"
        />
        <p className="text-[12px] text-muted">
          Demo password:{" "}
          <button
            type="button"
            className="font-mono text-accent hover:underline"
            onClick={() => {
              if (passwordRef.current) {
                passwordRef.current.value = DEMO_PASSWORD_HINT;
                passwordRef.current.focus();
              }
            }}
          >
            {DEMO_PASSWORD_HINT}
          </button>{" "}
          (click to fill)
        </p>
      </div>

      {state.error ? (
        <p className="animate-fade-up rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-3 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60 dark:text-[#06281c]"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-[12px] text-muted">
        <Link href="/" className="text-info hover:underline">
          Back to landing
        </Link>
      </p>
    </form>
  );
}
