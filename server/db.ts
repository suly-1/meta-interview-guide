import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, loginEvents } from "../drizzle/schema";
import { ENV } from './_core/env';

// ---------------------------------------------------------------------------
// Connection pool — shared across all queries.
//
// Why a pool instead of a single connection?
//   TiDB (and MySQL) drop idle connections after ~8 h. A single connection
//   therefore gets an ECONNRESET on the first query after a long idle period.
//   A pool reconnects automatically when a connection is found to be dead.
//
// Pool settings:
//   connectionLimit  – max simultaneous connections (low; this is a small app)
//   enableKeepAlive  – sends TCP keep-alive probes so the OS detects dead
//                      connections early and the pool can replace them
//   keepAliveInitialDelay – first keep-alive probe after 30 s of inactivity
//   waitForConnections – queue callers instead of throwing when pool is full
// ---------------------------------------------------------------------------

let _pool: mysql.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function createPool(): mysql.Pool {
  return mysql.createPool({
    uri: process.env.DATABASE_URL!,
    connectionLimit: 5,
    enableKeepAlive: true,
    keepAliveInitialDelay: 30_000,
    waitForConnections: true,
    queueLimit: 0,
    // Reconnect on connection errors so long-idle connections are replaced
    // automatically without restarting the server.
    connectTimeout: 10_000,
  });
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!process.env.DATABASE_URL) return null;

  if (!_pool || !_db) {
    try {
      _pool = createPool();
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to create connection pool:", error);
      _pool = null;
      _db = null;
    }
  }

  return _db;
}

/**
 * Reset the pool and drizzle instance so the next `getDb()` call creates a
 * fresh pool. Call this when a fatal connection error is detected (e.g.
 * ECONNRESET, ER_CON_COUNT_ERROR).
 */
export function resetDb() {
  if (_pool) {
    _pool.end().catch(() => {}); // best-effort drain
  }
  _pool = null;
  _db = null;
}

/**
 * Run `fn` with a DB instance, automatically resetting the pool and retrying
 * once if a connection-level error is detected (ECONNRESET, ECONNREFUSED,
 * PROTOCOL_CONNECTION_LOST, ER_CON_COUNT_ERROR).
 */
const RETRYABLE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST",
  "ER_CON_COUNT_ERROR",
]);

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const code = (e.code ?? (e.cause as Record<string, unknown>)?.code) as string | undefined;
  return !!code && RETRYABLE_CODES.has(code);
}

export async function withDb<T>(fn: (db: NonNullable<ReturnType<typeof drizzle>>) => Promise<T>): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    return await fn(db);
  } catch (err) {
    if (isRetryable(err)) {
      console.warn("[Database] Connection error — resetting pool and retrying once:", (err as Error).message);
      resetDb();
      const freshDb = await getDb();
      if (!freshDb) return null;
      return await fn(freshDb); // let the second failure propagate
    }
    throw err;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Record a login event for a user (fire-and-forget, non-critical).
 */
export async function recordLoginEvent(userId: number, ipAddress?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(loginEvents).values({ userId, ipAddress: ipAddress ?? null });
  } catch {
    // Non-critical — don't break login if this fails
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
