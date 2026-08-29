import type { Application, FieldPath } from "@/types";

const INDEX_RE = /^\d+$/;

/**
 * Resolve a dot path against an application.
 * Supports numeric segments for array indices: "products.0.productService"
 */
export function getField(app: Application, path: FieldPath): unknown {
  if (!path) return undefined;
  const segments = path.split(".");
  let current: unknown = app;

  for (const segment of segments) {
    if (current == null || typeof current !== "object") return undefined;

    if (Array.isArray(current)) {
      if (!INDEX_RE.test(segment)) return undefined;
      current = current[Number(segment)];
      continue;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export function citationResolves(app: Application, path: FieldPath): boolean {
  if (!path) return false;
  const segments = path.split(".");
  let current: unknown = app;

  for (const segment of segments) {
    if (current == null || typeof current !== "object") return false;

    if (Array.isArray(current)) {
      if (!INDEX_RE.test(segment)) return false;
      const index = Number(segment);
      if (index < 0 || index >= current.length) return false;
      current = current[index];
      continue;
    }

    if (!(segment in (current as object))) return false;
    current = (current as Record<string, unknown>)[segment];
  }

  return true;
}

export function validateCitations(
  app: Application,
  citations: FieldPath[],
): { valid: FieldPath[]; invalid: FieldPath[] } {
  const valid: FieldPath[] = [];
  const invalid: FieldPath[] = [];
  for (const path of citations) {
    if (citationResolves(app, path)) valid.push(path);
    else invalid.push(path);
  }
  return { valid, invalid };
}

export function isPresent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
