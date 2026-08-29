import type { Application } from "@/types";
import { getDb, isMongoConfigured } from "@/lib/db";
import {
  loadApplication as loadFixtureApplication,
  loadApplications as loadFixtureApplications,
} from "@/lib/loadFixtures";

export const APPLICATIONS_COLLECTION = "applications";

type ApplicationDoc = Application & { _id: string };

function stripMongoId(doc: ApplicationDoc): Application {
  const { _id, ...rest } = doc;
  void _id;
  return rest as Application;
}

/**
 * Prefers MongoDB when MONGODB_URI is set and the collection has rows.
 * Falls back to on-disk fixtures so tests and offline demos keep working.
 */
export async function getApplications(): Promise<Application[]> {
  if (!isMongoConfigured()) {
    return loadFixtureApplications();
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection<ApplicationDoc>(APPLICATIONS_COLLECTION)
      .find({})
      .sort({ _id: 1 })
      .toArray();

    if (docs.length === 0) {
      console.warn(
        "[applications] MongoDB is empty — falling back to fixtures. Run: npm run db:seed",
      );
      return loadFixtureApplications();
    }

    return docs.map(stripMongoId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.warn(
      `[applications] MongoDB unavailable (${message}) — falling back to fixtures.`,
    );
    return loadFixtureApplications();
  }
}

export async function getApplication(id: string): Promise<Application> {
  if (!isMongoConfigured()) {
    return loadFixtureApplication(id);
  }

  try {
    const db = await getDb();
    const doc = await db
      .collection<ApplicationDoc>(APPLICATIONS_COLLECTION)
      .findOne({ _id: id });
    if (!doc) {
      return loadFixtureApplication(id);
    }
    return stripMongoId(doc);
  } catch {
    return loadFixtureApplication(id);
  }
}
