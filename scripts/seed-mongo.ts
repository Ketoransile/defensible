/**
 * Seed MongoDB with the twelve sequa fixture applications.
 *
 * Usage:
 *   npm run db:seed
 *
 * Requires MONGODB_URI in .env.local (or the environment).
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { MongoClient, type AnyBulkWriteOperation } from "mongodb";
import type { Application } from "../src/types";

type ApplicationDoc = Omit<Application, "id"> & {
  _id: string;
  id: string;
};

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI is missing. Add it to .env.local and retry.");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB?.trim() || "defensible";
const dir = path.join(process.cwd(), "fixtures", "applications");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const apps: Application[] = files.map((file) => {
  const raw = readFileSync(path.join(dir, file), "utf8");
  return JSON.parse(raw) as Application;
});

const client = new MongoClient(uri);

try {
  await client.connect();
  const col = client.db(dbName).collection<ApplicationDoc>("applications");

  const ops: AnyBulkWriteOperation<ApplicationDoc>[] = apps.map((app) => ({
    replaceOne: {
      filter: { _id: app.id },
      replacement: { ...app, _id: app.id },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops, { ordered: true });
  const count = await col.countDocuments();

  console.log(
    `Seeded ${apps.length} applications into ${dbName}.applications ` +
      `(upserted ${result.upsertedCount}, modified ${result.modifiedCount}).`,
  );
  console.log(`Collection now has ${count} documents.`);
} finally {
  await client.close();
}
