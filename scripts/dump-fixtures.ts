import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildApplications, MANIFEST } from "../src/fixtures/catalog";

const dir = path.join(process.cwd(), "fixtures", "applications");
mkdirSync(dir, { recursive: true });

const apps = buildApplications();
for (const meta of MANIFEST) {
  const app = apps.find((a) => a.id === meta.id);
  if (!app) throw new Error(`Missing application ${meta.id}`);
  writeFileSync(path.join(dir, meta.file), `${JSON.stringify(app, null, 2)}\n`);
}

writeFileSync(
  path.join(process.cwd(), "fixtures", "manifest.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      notes:
        "Oracle for engine tests and demo numbers. expectedChecks lists eligibility + contradiction ids the fixture must trigger.",
      fixtures: MANIFEST,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${apps.length} applications + manifest.`);
