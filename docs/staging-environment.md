# Staging Environment Setup Guide

This document explains how to create and maintain a staging environment for meta-prep-guide so you can test changes safely before they reach real users on [metaengguide.pro](https://metaengguide.pro).

---

## Why You Need a Staging Environment

The production site at **metaengguide.pro** has real users and real data. Without a staging environment, every change you make is a live experiment. A staging environment gives you:

- A safe place to test schema migrations before running them on production data
- A way to verify AI features work end-to-end with real LLM calls
- A place to test the full OAuth login flow without affecting real user sessions
- Confidence that the smoke test passes before you click Publish on production

---

## Architecture Overview

| Environment    | URL                                   | Purpose                | Database            |
| -------------- | ------------------------------------- | ---------------------- | ------------------- |
| **Production** | https://metaengguide.pro              | Real users, real data  | Production DB       |
| **Staging**    | https://staging-metaguide.manus.space | Testing before deploy  | Separate staging DB |
| **Local dev**  | http://localhost:3000                 | Day-to-day development | Local or staging DB |

---

## Step-by-Step: Create a Staging Environment in Manus

### Step 1 — Create a new Manus project

1. Open the Manus platform and create a new project.
2. Name it something like `meta-prep-guide-staging`.
3. Choose the same template: **web-db-user** (React + tRPC + DB + Auth).

### Step 2 — Export the current code to GitHub

1. In the production project's Management UI → **Settings** → **GitHub**.
2. Export the code to a new private GitHub repository.
3. Note the repository URL (e.g., `github.com/yourname/meta-prep-guide`).

### Step 3 — Import the code into the staging project

1. In the staging project's Management UI → **Settings** → **GitHub**.
2. Connect the same GitHub repository.
3. The staging project will now track the same codebase.

### Step 4 — Configure staging secrets

In the staging project's **Settings → Secrets** panel, add:

```
# These are automatically injected by Manus — no action needed:
DATABASE_URL          ← Staging DB (separate from production)
JWT_SECRET            ← Auto-generated
VITE_APP_ID           ← Staging OAuth app ID
OAUTH_SERVER_URL      ← Same as production
VITE_OAUTH_PORTAL_URL ← Same as production
BUILT_IN_FORGE_API_KEY ← Same LLM API key
BUILT_IN_FORGE_API_URL ← Same

# Add these manually to distinguish staging from production:
VITE_APP_TITLE        = "MetaEng Guide (Staging)"
DIGEST_EMAIL          = your-email@example.com
```

### Step 5 — Run the database migration on staging

```bash
# In the staging project's terminal:
pnpm db:migrate-safe
```

This creates all tables in the staging database.

### Step 6 — Verify staging is working

```bash
# Run the smoke test against staging
npx tsx scripts/smoke-test.ts https://staging-metaguide.manus.space
```

---

## Workflow: How to Use Staging

### For every significant change:

1. **Develop locally** (`pnpm dev`)
2. **Run tests** (`pnpm test`)
3. **Save a checkpoint** in the production project
4. **Deploy to staging** by pushing to the GitHub branch that staging tracks
5. **Run the smoke test** against staging
6. **Verify manually** — click through the critical paths
7. **Click Publish** on the production project

### For schema changes:

```bash
# 1. Test the migration on staging first
pnpm db:migrate-safe

# 2. Verify the app works on staging
npx tsx scripts/smoke-test.ts https://staging-metaguide.manus.space

# 3. Only then run the migration on production
pnpm db:migrate-safe
```

---

## Keeping Staging in Sync

Staging can drift from production over time. To resync:

1. Export the latest production code to GitHub.
2. In the staging project, pull the latest code.
3. Run `pnpm db:migrate-safe` to apply any new migrations.
4. Verify with the smoke test.

---

## Cost Considerations

A Manus staging project uses the same resources as a production project. To minimize cost:

- Keep the staging project in **private** visibility so it doesn't consume public bandwidth.
- Hibernate the staging project when not in use (Manus auto-hibernates inactive projects).
- You do not need to keep staging running 24/7 — spin it up only when testing a significant change.

---

## Alternative: Local Staging

If you don't want a second Manus project, you can use a local staging setup:

```bash
# 1. Create a .env.staging file (never commit this)
cp .env .env.staging
# Edit .env.staging to point to a separate staging database

# 2. Run the dev server with staging config
NODE_ENV=staging DATABASE_URL=$(cat .env.staging | grep DATABASE_URL | cut -d= -f2) pnpm dev

# 3. Run the smoke test against localhost
npx tsx scripts/smoke-test.ts http://localhost:3000
```

This approach works for testing schema changes and server-side logic, but does not test the full OAuth flow or CDN behavior.

---

## Checklist: Before Every Production Deploy

- [ ] All tests pass: `pnpm test`
- [ ] TypeScript is clean: `npx tsc --noEmit`
- [ ] Smoke test passes on staging: `npx tsx scripts/smoke-test.ts https://staging-metaguide.manus.space`
- [ ] Schema migration tested on staging first (if applicable)
- [ ] Checkpoint saved in Manus
- [ ] Publish button clicked

---

_See also: [RUNBOOK.md](../RUNBOOK.md) for recovery procedures when things go wrong._
