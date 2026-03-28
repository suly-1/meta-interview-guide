import { eq, gt, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  loginEvents,
  visitorSessions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
      values.role = "admin";
      updateSet.role = "admin";
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

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Visitor Session helpers ────────────────────────────────────────────────────

/** Upsert a visitor heartbeat. Creates the row on first call, updates lastHeartbeatAt on subsequent calls. */
export async function upsertVisitorSession(
  sessionId: string,
  opts?: { inviteCode?: string; userAgent?: string; currentTab?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db
      .insert(visitorSessions)
      .values({
        sessionId,
        inviteCode: opts?.inviteCode ?? null,
        userAgent: opts?.userAgent ?? null,
        currentTab: opts?.currentTab ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          lastHeartbeatAt: new Date(),
          ...(opts?.currentTab ? { currentTab: opts.currentTab } : {}),
        },
      });
  } catch (err) {
    console.warn("[Database] Failed to upsert visitor session:", err);
  }
}

/** Return live visitor stats for the admin dashboard. */
export async function getVisitorStats() {
  const db = await getDb();
  if (!db) return null;

  const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 min = active
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEK_MS = 7 * DAY_MS;
  const now = new Date();
  const activeThreshold = new Date(now.getTime() - ACTIVE_WINDOW_MS);
  const dayThreshold = new Date(now.getTime() - DAY_MS);
  const weekThreshold = new Date(now.getTime() - WEEK_MS);

  const [totalRows, activeRows, todayRows, weekRows, perCodeRows] =
    await Promise.all([
      db.select({ n: count() }).from(visitorSessions),
      db
        .select({ n: count() })
        .from(visitorSessions)
        .where(gt(visitorSessions.lastHeartbeatAt, activeThreshold)),
      db
        .select({ n: count() })
        .from(visitorSessions)
        .where(gt(visitorSessions.firstSeenAt, dayThreshold)),
      db
        .select({ n: count() })
        .from(visitorSessions)
        .where(gt(visitorSessions.firstSeenAt, weekThreshold)),
      db
        .select({
          code: visitorSessions.inviteCode,
          n: count(),
        })
        .from(visitorSessions)
        .groupBy(visitorSessions.inviteCode),
    ]);

  return {
    total: totalRows[0]?.n ?? 0,
    active: activeRows[0]?.n ?? 0,
    today: todayRows[0]?.n ?? 0,
    week: weekRows[0]?.n ?? 0,
    perCode: perCodeRows.map(r => ({ code: r.code ?? "(none)", count: r.n })),
  };
}

// TODO: add feature queries here as your schema grows.

/** Record a login event for the given user (fire-and-forget, non-fatal). */
export async function recordLoginEvent(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(loginEvents).values({ userId });
  } catch (err) {
    console.warn("[Database] Failed to record login event:", err);
  }
}
