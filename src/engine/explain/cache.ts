import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReviewerBrief } from "@/types";

export function cacheDir(): string {
  return path.join(process.cwd(), "cache", "llm");
}

export function factsHash(facts: unknown): string {
  return createHash("sha256").update(JSON.stringify(facts)).digest("hex").slice(0, 16);
}

export function cachePath(applicationId: string, hash: string): string {
  return path.join(cacheDir(), `${applicationId}-${hash}.json`);
}

export function readCachedBrief(
  applicationId: string,
  hash: string,
): ReviewerBrief | null {
  const file = cachePath(applicationId, hash);
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as ReviewerBrief;
    if (parsed.headline && parsed.whyThisRank && parsed.justification) {
      return { ...parsed, source: "gemini" };
    }
  } catch {
    return null;
  }
  return null;
}

export function writeCachedBrief(
  applicationId: string,
  hash: string,
  brief: ReviewerBrief,
): void {
  mkdirSync(cacheDir(), { recursive: true });
  writeFileSync(cachePath(applicationId, hash), `${JSON.stringify(brief, null, 2)}\n`);
}
