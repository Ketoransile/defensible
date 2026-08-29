import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "defensible_session";
export const SESSION_DAYS = 7;

export interface SessionPayload {
  name: string;
  exp: number;
}

function authSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.DEMO_ACCESS_CODE ||
    "defensible-hackathon-demo"
  );
}

export function expectedAccessCode(): string {
  return process.env.DEMO_ACCESS_CODE || "defensible";
}

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", authSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", authSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.name || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionExpiryMs(): number {
  return Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
}
