# Staging Environment Guide

This document explains how to test changes in a staging environment before deploying to production at [metaengguide.pro](https://metaengguide.pro).

---

## Why Use a Staging Environment

Every change deployed directly to production carries risk. A staging environment lets you verify that new features, database migrations, and configuration changes work correctly before real users see them. The goal is to make "deploy to production" a boring, routine event rather than a stressful one.

---

## Option 1: Local Dev Server (Fastest, Recommended for Daily Work)

The local dev server at `http://localhost:3000` is your primary staging environment. It runs the full stack (React + Express + tRPC + MySQL) with hot module replacement.

```bash
# Start the dev server
pnpm dev

# In a separate terminal, run all tests
pnpm test

# Run the smoke test against the local server
pnpm smoke:test
```

**What to verify before every deploy:**

| Check | Command | Expected result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Unit tests | `pnpm test` | All pass |
| Build succeeds | `pnpm build` | No errors |
| Smoke test | `pnpm smoke:test` | All checks pass |

---

## Option 2: Preview Build (Closest to Production)

Before deploying to GitHub Pages, build and serve the production bundle locally to catch any build-time issues.

```bash
# Build the production bundle
pnpm build

# Serve the production build locally (requires a static file server)
npx serve dist/public -p 4000

# Run the smoke test against the preview build
node scripts/smoke-test.mjs --url http://localhost:4000
```

This catches issues that only appear in the minified/bundled build, such as tree-shaking removing needed code or environment variable substitution failures.

---

## Option 3: Manus Preview URL (Share with Stakeholders)

The Manus platform provides a preview URL for every running dev server:

```
https://3000-<sandbox-id>.manus.computer
```

This URL is accessible from any browser and can be shared with stakeholders for review before publishing. It runs the full stack including the database, so all features work exactly as they would in production.

**How to get the preview URL:** It appears in the Manus chat interface after the project is initialized.

---

## Option 4: Separate Staging Deployment (For Major Changes)

For large refactors, database migrations, or new authentication flows, create a separate deployment:

1. Create a new Manus project with `--private` flag
2. Copy the current codebase to it
3. Apply your changes to the staging project
4. Test thoroughly
5. Once verified, apply the same changes to the production project

This is the safest option for changes that could break the database schema or authentication.

---

## Pre-Deploy Checklist

Run through this checklist before every deploy to production:

```
[ ] pnpm test — all tests pass
[ ] npx tsc --noEmit — 0 TypeScript errors
[ ] pnpm build — build succeeds without errors
[ ] pnpm smoke:test — smoke test passes
[ ] Tested the specific feature that was changed in the browser
[ ] Tested on mobile viewport (Chrome DevTools → Toggle device toolbar)
[ ] Admin panel still accessible and functional
[ ] No console errors in the browser DevTools
```

---

## Database Migration Safety

Never run `pnpm db:push` directly on production without first testing on a local or staging database. Use the safe migration script instead:

```bash
# Preview what will change (no DB writes)
node scripts/db-migrate-safe.mjs --dry-run

# Apply with confirmation prompt
node scripts/db-migrate-safe.mjs

# Apply non-interactively (CI/CD)
node scripts/db-migrate-safe.mjs --yes
```

See `scripts/db-migrate-safe.mjs` for full documentation.

---

## Environment Variables

The staging environment should use the same environment variable names as production but with different values (e.g., a separate test database). Never use the production `DATABASE_URL` in a staging environment.

| Variable | Production | Staging |
|---|---|---|
| `DATABASE_URL` | Production DB | Staging DB (separate) |
| `JWT_SECRET` | Production secret | Any random string |
| `ADMIN_SECRET_TOKEN` | Production token | Any test token |

---

## Rolling Back a Bad Deploy

If a deploy breaks production, see `RUNBOOK.md` for step-by-step rollback instructions.
