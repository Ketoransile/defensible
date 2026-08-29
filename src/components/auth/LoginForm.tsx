"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="mx-auto w-full max-w-md space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block font-mono text-[11px] tracking-[0.16em] text-muted uppercase"
        >
          Reviewer name
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="Your name"
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-foreground outline-none transition focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="code"
          className="block font-mono text-[11px] tracking-[0.16em] text-muted uppercase"
        >
          Access code
        </label>
        <input
          id="code"
          name="code"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Demo access code"
          className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5 font-mono text-[14px] text-foreground outline-none transition focus:border-accent"
        />
        <p className="text-[12px] text-muted">
          Judges: use{" "}
          <span className="font-mono text-accent">defensible</span>
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
        className="w-full rounded-sm bg-accent px-4 py-3 text-[14px] font-semibold text-[#06281c] transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter review console"}
      </button>

      <p className="text-center text-[12px] text-muted">
        <Link href="/" className="text-info hover:underline">
          Back to landing
        </Link>
      </p>
    </form>
  );
}
