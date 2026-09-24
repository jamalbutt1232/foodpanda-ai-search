import mongoose from "mongoose";
import { getDbEnv } from "@/lib/env";

type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Survive Next.js dev hot reloads without opening a new connection each time.
const globalForMongoose = globalThis as typeof globalThis & { __mongoose?: ConnectionCache };
const cache = (globalForMongoose.__mongoose ??= { conn: null, promise: null });

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(getDbEnv().MONGODB_URI, {
    serverSelectionTimeoutMS: 5_000,
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // allow a retry on the next request
    throw error;
  }
  return cache.conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
