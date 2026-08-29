import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Application } from "@/types";
import { MANIFEST, type FixtureMeta } from "@/fixtures/catalog";

export interface ManifestFile {
  generatedAt: string;
  notes: string;
  fixtures: FixtureMeta[];
}

export function fixturesDir(): string {
  return path.join(process.cwd(), "fixtures");
}

export function loadManifest(): ManifestFile {
  const raw = readFileSync(path.join(fixturesDir(), "manifest.json"), "utf8");
  return JSON.parse(raw) as ManifestFile;
}

export function loadApplications(): Application[] {
  const dir = path.join(fixturesDir(), "applications");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  return files.map((file) => {
    const raw = readFileSync(path.join(dir, file), "utf8");
    return JSON.parse(raw) as Application;
  });
}

export function loadApplication(id: string): Application {
  const meta = MANIFEST.find((m) => m.id === id);
  if (!meta) throw new Error(`Unknown fixture id: ${id}`);
  const raw = readFileSync(
    path.join(fixturesDir(), "applications", meta.file),
    "utf8",
  );
  return JSON.parse(raw) as Application;
}

export { MANIFEST };
