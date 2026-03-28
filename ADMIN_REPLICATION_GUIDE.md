# Admin Features Replication Guide

This document is a complete, self-contained reference for every admin feature built into this project. It is written so that any of these features can be reproduced on a new website from scratch, without needing to read the source code.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Tables](#2-database-tables)
3. [Environment Variables & Secrets](#3-environment-variables--secrets)
4. [Feature 1 — Invite-Code Access Gate](#4-feature-1--invite-code-access-gate)
5. [Feature 2 — Admin PIN Gate](#5-feature-2--admin-pin-gate)
6. [Feature 3 — User Management (Block / Unblock)](#6-feature-3--user-management-block--unblock)
7. [Feature 4 — Audit Log & CSV Export](#7-feature-4--audit-log--csv-export)
8. [Feature 5 — Site Access Controls (Kill Switch + Disclaimer Toggle)](#8-feature-5--site-access-controls-kill-switch--disclaimer-toggle)
9. [Feature 6 — Admin Analytics Dashboard](#9-feature-6--admin-analytics-dashboard)
10. [Feature 7 — Feedback Triage Dashboard](#10-feature-7--feedback-triage-dashboard)
11. [Feature 8 — Disclaimer Acknowledgment Report](#11-feature-8--disclaimer-acknowledgment-report)
12. [Feature 9 — Cohort Health Summary](#12-feature-9--cohort-health-summary)
13. [Feature 10 — Version Update Toast](#13-feature-10--version-update-toast)
14. [Feature 11 — Privacy Protections (Branding Removal + Content Framing)](#14-feature-11--privacy-protections)
15. [Admin Navigation Structure](#15-admin-navigation-structure)
16. [Seed SQL](#16-seed-sql)
17. [Replication Checklist](#17-replication-checklist)

---

## 1. Architecture Overview

All admin features follow the same three-layer pattern used throughout the project:

**Database layer** (`drizzle/schema.ts`) defines tables using Drizzle ORM with MySQL/TiDB. Schema changes are applied with `pnpm db:push`.

**Server layer** (`server/routers/*.ts`) exposes tRPC procedures. Admin-only procedures use `ownerProcedure` (checks `ctx.user.openId === ENV.ownerOpenId`) or `protectedProcedure` with a manual role check. No admin logic runs on the client.

**Frontend layer** (`client/src/pages/Admin*.tsx`) calls tRPC hooks. Every admin page checks `trpc.auth.isOwner.useQuery()` before rendering sensitive data and redirects non-owners to `/404`.

The admin section is reachable at `/admin` and is not linked from the public navigation — it is accessed by typing the URL directly or via a hidden keyboard shortcut.

---

## 2. Database Tables

The following tables are required to support all admin features. Each is defined in `drizzle/schema.ts` and must be created via `pnpm db:push` or the SQL in [Section 16](#16-seed-sql).

| Table                | Purpose                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `users`              | All registered users. Includes `blocked`, `blockReason`, `blockedUntil`, `role`, `lastSignedIn` columns.                     |
| `user_events`        | Audit log. Every block/unblock/re-block action writes a row here.                                                            |
| `login_events`       | Login history. One row per login, used for "weekly active" stats and per-user login history.                                 |
| `site_settings`      | Single-row table. Stores `siteEnabled` (kill switch) and `disclaimerEnabled` (disclaimer gate toggle).                       |
| `invite_codes`       | One row per invite code. Stores `code`, `cohortName`, `welcomeMessage`, `active`.                                            |
| `invite_attempt_log` | One row per gate attempt. Stores `ip`, `codeTried`, `success`, `userAgent`, `createdAt`. Used for server-side rate limiting. |

### Key columns added to the `users` table

```sql
blocked         TINYINT(1)   NOT NULL DEFAULT 0
blockReason     TEXT
blockedUntil    TIMESTAMP    NULL
role            ENUM('admin','user') NOT NULL DEFAULT 'user'
lastSignedIn    TIMESTAMP    NULL
```

---

## 3. Environment Variables & Secrets

| Variable           | Where set     | Purpose                                                                         |
| ------------------ | ------------- | ------------------------------------------------------------------------------- |
| `ADMIN_PIN`        | Secrets panel | 4–8 digit PIN required to enter the admin area                                  |
| `VITE_INVITE_CODE` | Secrets panel | Master invite code checked server-side against the gate                         |
| `OWNER_OPEN_ID`    | Auto-injected | The platform OpenID of the site owner; used to identify the owner without a PIN |
| `OWNER_NAME`       | Auto-injected | Display name of the owner                                                       |
| `JWT_SECRET`       | Auto-injected | Signs session cookies                                                           |
| `DATABASE_URL`     | Auto-injected | MySQL/TiDB connection string                                                    |

The `ADMIN_PIN` and `VITE_INVITE_CODE` are the only secrets that need to be set manually. All others are injected by the platform.

---

## 4. Feature 1 — Invite-Code Access Gate

**What it does.** A full-screen gate that blocks the entire site until the visitor enters a valid invite code. The code is validated server-side (not in the browser), so it cannot be bypassed by inspecting JavaScript. Failed attempts are logged to the database and the IP is locked out for 5 minutes after 3 wrong attempts.

**Files involved.**

| File                                   | Role                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `client/src/components/InviteGate.tsx` | Full-screen gate UI with lockout countdown, animated welcome screen, and 4-slide feature tour |
| `client/src/App.tsx`                   | Wraps the entire `<Router>` in `<InviteGate>`                                                 |
| `server/routers/invite.ts`             | `verifyCode` mutation + `getLockoutStatus` query                                              |
| `drizzle/schema.ts`                    | `inviteCodes` and `inviteAttemptLog` tables                                                   |

**Server procedure: `invite.verifyCode`**

Input: `{ code: string }`. The procedure extracts the client IP from `x-forwarded-for` headers, counts failed attempts for that IP in the last 5 minutes, throws `TOO_MANY_REQUESTS` if ≥ 3, validates the code against `ENV.inviteCode` (case-insensitive), logs the attempt, and on success fetches the matching row from `invite_codes` to return `{ valid: true, cohortName, welcomeMessage }`.

**Server procedure: `invite.getLockoutStatus`**

Returns `{ lockedOut: boolean, secondsRemaining: number, attemptsUsed: number }` for the calling IP. The frontend polls this on mount to restore a lockout state that survives page refresh.

**Key constants in `InviteGate.tsx`.**

```ts
const MAX_ATTEMPTS = 3; // attempts before lockout
const LOCKOUT_SECONDS = 300; // 5-minute lockout
const WELCOME_DURATION_MS = 5000; // welcome screen auto-dismiss
```

**Per-code welcome messages.** Each row in `invite_codes` can carry a `cohortName` and `welcomeMessage`. When the server validates a code, it looks up the matching row and returns these fields. The welcome screen displays them. To add a new cohort:

```sql
INSERT INTO invite_codes (code, cohortName, welcomeMessage, active)
VALUES ('NEWCODE', 'Cohort 3', 'Welcome, Cohort 3!', true);
```

**To rotate the master code.** Update `VITE_INVITE_CODE` in the Secrets panel and republish. The old code stops working immediately.

---

## 5. Feature 2 — Admin PIN Gate

**What it does.** A modal dialog that appears when any user navigates to `/admin`. It requires a numeric PIN (stored in `ADMIN_PIN` env var) before granting access to the admin area. The owner (identified by `OWNER_OPEN_ID`) bypasses the PIN automatically. Failed PIN attempts are logged server-side. After 5 consecutive wrong PINs, the IP is locked out for 15 minutes.

**Files involved.**

| File                                     | Role                                                |
| ---------------------------------------- | --------------------------------------------------- |
| `client/src/components/AdminPinGate.tsx` | PIN modal UI with countdown, lockout display        |
| `client/src/pages/AdminAccess.tsx`       | `/admin` landing page that renders `<AdminPinGate>` |
| `server/routers/siteAccess.ts`           | `verifyAdminPin` mutation                           |

**Server procedure: `siteAccess.verifyAdminPin`**

Input: `{ pin: string }`. Compares against `ENV.adminPin`. Logs failed attempts to the `user_events` audit table. Returns `{ success: true }` on match or throws `FORBIDDEN`.

**Owner bypass.** The `AdminPinGate` component calls `trpc.auth.isOwner.useQuery()`. If `isOwner === true`, it skips the PIN dialog entirely and grants access immediately.

---

## 6. Feature 3 — User Management (Block / Unblock)

**What it does.** The `/admin/users` page lists all registered users with their status (active, blocked, block reason, block expiry). The owner can block a user with an optional reason and optional auto-expiry duration (1 hour, 24 hours, 3 days, 7 days, 30 days, or permanent). Blocked users are rejected at the server level on every tRPC request — they cannot use the site even if they have a valid session cookie.

**Files involved.**

| File                              | Role                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| `client/src/pages/AdminUsers.tsx` | User list UI with block/unblock/re-block/extend controls      |
| `server/routers/adminUsers.ts`    | All user management procedures                                |
| `server/_core/context.ts`         | Checks `user.blocked` on every request and throws `FORBIDDEN` |

**Server procedures in `adminUsers.ts`.**

| Procedure             | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `listUsers`           | Returns all users with `blocked`, `blockReason`, `blockedUntil`, `lastSignedIn` |
| `blockUser`           | Sets `blocked=true`, writes audit log row, sends owner notification             |
| `unblockUser`         | Sets `blocked=false`, clears reason/expiry, writes audit log                    |
| `reBlockUser`         | Re-applies a block from a previous audit log row (supports `expiryDays`)        |
| `extendBlock`         | Updates `blockedUntil` on an already-blocked user                               |
| `getUserStats`        | Returns `{ total, weeklyActive, blocked }` counts for the cohort health card    |
| `listEvents`          | Returns last 200 audit log rows                                                 |
| `exportAuditLogCsv`   | Returns full audit log as a CSV string for download                             |
| `getUserLoginHistory` | Returns last 5 login timestamps for a specific user                             |

**Server-side block enforcement.** In `server/_core/context.ts`, after the user is resolved from the session cookie, the code checks:

```ts
if (user.blocked) {
  const expiry = user.blockedUntil;
  if (!expiry || new Date(expiry) > new Date()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account has been suspended.",
    });
  }
  // Auto-unblock if expiry has passed
  await db.update(users).set({ blocked: false }).where(eq(users.id, user.id));
}
```

---

## 7. Feature 4 — Audit Log & CSV Export

**What it does.** Every admin action (block, unblock, re-block, extend) writes a row to the `user_events` table. The `/admin/users` page has an "Audit Log" tab showing the last 200 events with actor name, target name, event type, metadata, and timestamp. A "Export CSV" button downloads the full log.

**Database table: `user_events`.**

```ts
userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  actorName: varchar("actorName", { length: 128 }),
  targetId: int("targetId").notNull(),
  targetName: varchar("targetName", { length: 128 }),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**Event types used:** `block_user`, `unblock_user`, `re_block_user`, `extend_block`.

**CSV export.** The `exportAuditLogCsv` procedure queries all rows, formats them as CSV with headers `id,actorId,actorName,targetId,targetName,eventType,metadata,createdAt`, and returns the string. The frontend triggers a browser download using a `Blob` and `URL.createObjectURL`.

---

## 8. Feature 5 — Site Access Controls (Kill Switch + Disclaimer Toggle)

**What it does.** The `/admin` page has two global toggles:

1. **Kill switch** — when turned off, all visitors (except the owner) see a "Site temporarily unavailable" message. The check happens server-side in `context.ts`.
2. **Disclaimer toggle** — when enabled, all users must acknowledge a disclaimer before accessing the site. When disabled globally, the disclaimer gate is skipped for everyone.

**Files involved.**

| File                               | Role                              |
| ---------------------------------- | --------------------------------- |
| `client/src/pages/AdminAccess.tsx` | Toggle UI for both controls       |
| `server/routers/siteAccess.ts`     | All site access procedures        |
| `drizzle/schema.ts`                | `siteSettings` table (single row) |

**Database table: `site_settings`.**

```ts
siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  siteEnabled: int("siteEnabled").notNull().default(1),
  disclaimerEnabled: int("siteEnabled").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

**Server procedures in `siteAccess.ts`.**

| Procedure              | Access | Description                                                 |
| ---------------------- | ------ | ----------------------------------------------------------- |
| `getSiteEnabled`       | public | Returns `{ enabled: boolean }` — checked on every page load |
| `setSiteEnabled`       | owner  | Toggles the kill switch                                     |
| `getDisclaimerEnabled` | public | Returns `{ enabled: boolean }`                              |
| `setDisclaimerEnabled` | owner  | Toggles the disclaimer gate                                 |
| `verifyAdminPin`       | public | Validates the admin PIN                                     |

**Kill switch enforcement.** A `SiteGate` component wraps the app and calls `trpc.siteAccess.getSiteEnabled.useQuery()` on mount. If `enabled === false` and the current user is not the owner, it renders a maintenance screen instead of the app.

---

## 9. Feature 6 — Admin Analytics Dashboard

**What it does.** The `/admin/analytics` page shows live site analytics: total visitors, session durations, page views per tab, feature engagement counts, device/browser breakdown (pie chart), DAU trend (line chart), and the top 3 unactioned feedback items.

**Files involved.**

| File                                  | Role                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| `client/src/pages/AdminAnalytics.tsx` | Full analytics dashboard with Recharts visualisations |
| `server/routers/analytics.ts`         | All analytics query procedures                        |

**Server procedures in `analytics.ts`.**

| Procedure            | Returns                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `getOverview`        | `{ totalSessions, avgDuration, totalPageViews, returningUsers }` |
| `getPageViews`       | Array of `{ page, views }` for bar chart                         |
| `getDeviceBreakdown` | Array of `{ device, count }` for pie chart                       |
| `getDauTrend`        | Array of `{ date, users }` for last 30 days line chart           |
| `getTopFeedback`     | Top 3 unactioned feedback items                                  |

Analytics data is derived from the `login_events` table and a `page_views` table (if implemented) or from the Umami analytics integration.

---

## 10. Feature 7 — Feedback Triage Dashboard

**What it does.** The `/admin/feedback` page shows all user-submitted feedback in a sortable, filterable table. Each entry has a triage status (`new`, `in_progress`, `done`, `dismissed`) that the owner can update. Entries can be filtered by category (Bug, Feature Request, etc.) and sorted by date or type. A "Download CSV" button exports all feedback.

**Files involved.**

| File                                 | Role                     |
| ------------------------------------ | ------------------------ |
| `client/src/pages/AdminFeedback.tsx` | Feedback triage UI       |
| `server/routers/feedback.ts`         | Feedback CRUD procedures |

**Triage statuses and their visual treatment.**

| Status        | Colour     |
| ------------- | ---------- |
| `new`         | Blue       |
| `in_progress` | Amber      |
| `done`        | Emerald    |
| `dismissed`   | Muted grey |

---

## 11. Feature 8 — Disclaimer Acknowledgment Report

**What it does.** The `/admin/disclaimer-report` page lists every registered user alongside their disclaimer acknowledgment status and timestamp. The owner can see at a glance who has and has not acknowledged the disclaimer. The list is sortable and filterable, and can be exported as CSV.

**Files involved.**

| File                                         | Role                    |
| -------------------------------------------- | ----------------------- |
| `client/src/pages/AdminDisclaimerReport.tsx` | Report UI               |
| `server/routers/disclaimer.ts`               | `adminReport` procedure |

**Server procedure: `disclaimer.adminReport`** (owner only). Returns an array of `{ id, name, email, createdAt, lastSignedIn, acknowledgedAt }` for all users.

---

## 12. Feature 9 — Cohort Health Summary

**What it does.** A summary card on the `/admin` landing page showing three KPIs at a glance: total registered users, weekly active users (logged in at least once in the last 7 days), and currently blocked users.

**Server procedure: `adminUsers.getUserStats`** (owner only). Returns `{ total: number, weeklyActive: number, blocked: number }`.

**Frontend.** Three `KpiCard` components arranged in a row, each showing an icon, label, and value. Auto-refreshes every 60 seconds.

---

## 13. Feature 10 — Version Update Toast

**What it does.** A 10-second auto-dismissing toast in the top-right corner that appears whenever the site has been updated. It shows the update timestamp and a short changelog message fetched from `/api/changelog`. A blue progress bar drains as the timer counts down.

**Files involved.**

| File                                           | Role                                          |
| ---------------------------------------------- | --------------------------------------------- |
| `client/src/components/VersionUpdateToast.tsx` | Toast UI with countdown progress bar          |
| `server/_core/index.ts`                        | `/api/version` and `/api/changelog` endpoints |

**How version detection works.** On mount, the component fetches `/api/version` and stores the result in `localStorage`. Every 60 seconds it polls again. If the version string has changed, it fetches `/api/changelog` for the message and shows the toast.

**`/api/changelog` endpoint.** Returns `{ message: string }`. The message is a hardcoded string in `server/_core/index.ts` that you update manually before each deploy to describe what changed.

---

## 14. Feature 11 — Privacy Protections

These are not admin features in the traditional sense, but they are owner-configured protections that should be replicated on any site where anonymity matters.

| Protection                          | Implementation                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| No platform branding in HTML source | Removed generator `<meta>` tags from `client/index.html`                                            |
| Strong public-resource disclaimer   | Banner in `TopNav.tsx` citing NeetCode, HelloInterview, Glassdoor, Blind as sources                 |
| No insider-language in content      | All first-person interviewer phrases replaced with third-person community framing                   |
| No external links tracing to owner  | Removed GitHub repo links, Twitter share buttons, and owner domain links                            |
| Invite-code gate                    | See Feature 1 above                                                                                 |
| Anonymous analytics                 | Umami script in `client/index.html` using `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` |

---

## 15. Admin Navigation Structure

The admin section uses a simple flat URL structure with no sidebar. All pages are linked from the `/admin` landing page.

| URL                        | Page                                                              | Access                     |
| -------------------------- | ----------------------------------------------------------------- | -------------------------- |
| `/admin`                   | Landing page — kill switch, disclaimer toggle, cohort health KPIs | Owner only (PIN or OpenID) |
| `/admin/users`             | User list, block/unblock, audit log, CSV export                   | Owner only                 |
| `/admin/analytics`         | Site analytics dashboard                                          | Owner only                 |
| `/admin/feedback`          | Feedback triage                                                   | Owner only                 |
| `/admin/disclaimer-report` | Disclaimer acknowledgment audit                                   | Owner only                 |

The `/admin` route is registered in `client/src/App.tsx` but is not linked from any public navigation component. Access is by direct URL only.

---

## 16. Seed SQL

Run these statements after creating the tables to set up the initial state for a new site.

```sql
-- Create the single site_settings row
INSERT INTO site_settings (id, siteEnabled, disclaimerEnabled)
VALUES (1, 1, 1)
ON DUPLICATE KEY UPDATE id = id;

-- Create the primary invite code (replace GO000 with your chosen code)
INSERT INTO invite_codes (code, cohortName, welcomeMessage, active)
VALUES (
  'GO000',
  'Study Group',
  'Welcome! You now have full access to the community prep resource. Good luck with your preparation.',
  true
);

-- Optional: add a second cohort code
INSERT INTO invite_codes (code, cohortName, welcomeMessage, active)
VALUES (
  'COHORT2',
  'Cohort 2',
  'Welcome, Cohort 2! You have access to the full study guide. Good luck!',
  true
);
```

---

## 17. Replication Checklist

Use this checklist when setting up the admin system on a new website.

**Database**

- [ ] Add `blocked`, `blockReason`, `blockedUntil`, `role`, `lastSignedIn` columns to the `users` table
- [ ] Create `user_events` table (audit log)
- [ ] Create `login_events` table (login history)
- [ ] Create `site_settings` table and insert the seed row
- [ ] Create `invite_codes` table and insert at least one code
- [ ] Create `invite_attempt_log` table
- [ ] Run `pnpm db:push` to apply all schema changes

**Secrets**

- [ ] Set `ADMIN_PIN` in the Secrets panel
- [ ] Set `VITE_INVITE_CODE` in the Secrets panel to match the primary row in `invite_codes`

**Server**

- [ ] Copy `server/routers/invite.ts` — invite gate with IP rate limiting
- [ ] Copy `server/routers/adminUsers.ts` — user management and audit log
- [ ] Copy `server/routers/siteAccess.ts` — kill switch and disclaimer toggle
- [ ] Copy `server/routers/analytics.ts` — analytics queries
- [ ] Copy `server/routers/feedback.ts` — feedback triage
- [ ] Copy `server/routers/disclaimer.ts` — disclaimer acknowledgment
- [ ] Register all routers in `server/routers.ts`
- [ ] Add block enforcement check in `server/_core/context.ts`
- [ ] Add `/api/version` and `/api/changelog` endpoints in `server/_core/index.ts`
- [ ] Add `inviteCode` and `adminPin` to `server/_core/env.ts`

**Frontend**

- [ ] Copy `client/src/components/InviteGate.tsx` and wrap `<App>` with it
- [ ] Copy `client/src/components/AdminPinGate.tsx`
- [ ] Copy `client/src/components/VersionUpdateToast.tsx` and add to `App.tsx`
- [ ] Copy `client/src/pages/AdminAccess.tsx`
- [ ] Copy `client/src/pages/AdminUsers.tsx`
- [ ] Copy `client/src/pages/AdminAnalytics.tsx`
- [ ] Copy `client/src/pages/AdminFeedback.tsx`
- [ ] Copy `client/src/pages/AdminDisclaimerReport.tsx`
- [ ] Register `/admin`, `/admin/users`, `/admin/analytics`, `/admin/feedback`, `/admin/disclaimer-report` routes in `App.tsx`

**Privacy**

- [ ] Remove generator `<meta>` tags from `client/index.html`
- [ ] Add public-resource disclaimer to the top navigation banner
- [ ] Remove any insider-language from content
- [ ] Remove all external links that trace to the owner
- [ ] Add Umami analytics script to `client/index.html`

---

_Last updated: March 2026. Reflects the state of the meta-prep-guide project at checkpoint `52d3e4d7` and later._
