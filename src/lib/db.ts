import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

export function mongoUri(): string | undefined {
  const uri = process.env.MONGODB_URI?.trim();
  return uri || undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(mongoUri());
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = mongoUri();
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }

  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const name = process.env.MONGODB_DB?.trim() || "defensible";
  return client.db(name);
}
