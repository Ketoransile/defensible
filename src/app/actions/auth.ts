"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  expectedAccessCode,
  sessionExpiryMs,
  signSession,
} from "@/lib/auth";

export type AuthState = { error?: string };

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(
    formData.get("username") ?? formData.get("name") ?? "",
  ).trim();
  const password = String(
    formData.get("password") ?? formData.get("code") ?? "",
  ).trim();

  if (!name) return { error: "Enter a username to continue." };
  if (password !== expectedAccessCode()) {
    return {
      error: `Wrong password. Use the demo password “${expectedAccessCode()}”.`,
    };
  }

  const token = signSession({ name, exp: sessionExpiryMs() });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  redirect("/review");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
