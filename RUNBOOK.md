# Operations Runbook

This document contains step-by-step procedures for the most common operational scenarios. Keep this open when deploying or responding to incidents.

---

## Scenario 1: Site is Down After a Deploy

**Symptoms:** The site at [metaengguide.pro](https://metaengguide.pro) returns a blank page, 500 error, or fails to load.

**Steps:**

1. **Check the Manus Dashboard** — open the Management UI and look at the Dashboard panel. Check if the dev server is running and if there are recent error logs.

2. **Check the server logs:**
   ```bash
   tail -50 .manus-logs/devserver.log
   ```
   Look for `Error`, `Cannot find module`, or `ECONNREFUSED`.

3. **Check the browser console:**
   ```bash
   tail -20 .manus-logs/browserConsole.log
   ```
   Look for `TypeError`, `ReferenceError`, or `ChunkLoadError`.

4. **If the issue is a JavaScript crash:** Roll back to the last known-good checkpoint using the Manus Management UI → Checkpoints → click "Rollback" on the previous checkpoint.

5. **If the issue is a server crash:** Restart the dev server from the Manus Management UI, or run:
   ```bash
   pnpm dev
   ```

6. **If the issue is a bad build deployed to GitHub Pages:** Re-deploy the previous working build:
   ```bash
   git log --oneline -10   # find the last good commit hash
   git checkout <hash> -- dist/  # restore the old build
   git push github HEAD:main
   ```

7. **Verify recovery:** Run the smoke test against the live site:
   ```bash
   pnpm smoke:test:live
   ```

---

## Scenario 2: Database Error After Migration

**Symptoms:** Pages that load data show errors, the server logs show `ER_NO_SUCH_TABLE` or `ER_BAD_FIELD_ERROR`, or the admin panel shows empty data.

**Steps:**

1. **Do not run `db:push` again** — this could make things worse.

2. **Check the migration log:**
   ```bash
   ls -la drizzle/migrations/
   ```
   Look for the most recent migration file and inspect it.

3. **Check the database state** using the Manus Database panel (Management UI → Database). Verify which tables exist and whether the expected columns are present.

4. **If a column is missing:** The migration may have partially failed. Add the missing column manually using the Database panel:
   ```sql
   ALTER TABLE your_table ADD COLUMN new_column VARCHAR(255);
   ```

5. **If a table is missing:** Re-run the migration safely:
   ```bash
   node scripts/db-migrate-safe.mjs
   ```

6. **If data was accidentally deleted:** Contact Manus support immediately — database backups may be available.

7. **To prevent this in future:** Always use the safe migration script:
   ```bash
   node scripts/db-migrate-safe.mjs --dry-run  # preview first
   node scripts/db-migrate-safe.mjs            # then apply
   ```

---

## Scenario 3: Admin Panel Inaccessible

**Symptoms:** Navigating to `/admin` shows "Admin Access Restricted" even when logged in as the owner.

**Steps:**

1. **Verify you are logged in** — click the user icon or navigate to the home page. If you see "Sign In", you are not logged in.

2. **Log in via Manus OAuth** — click "Sign In" and complete the OAuth flow.

3. **Verify your account is the owner** — the admin panel is restricted to the account whose `OWNER_OPEN_ID` matches the environment variable. If you are using a different Manus account, you will not have access.

4. **Check the `OWNER_OPEN_ID` env var** — in the Manus Management UI → Settings → Secrets, verify that `OWNER_OPEN_ID` is set to your Manus account's open ID.

5. **If the OAuth flow is broken:** Check the server logs for OAuth errors:
   ```bash
   grep -i "oauth\|callback\|token" .manus-logs/devserver.log | tail -20
   ```

6. **Emergency access:** If you are completely locked out, use the Manus Management UI → Database panel to directly query the `user` table and verify your account exists with `role = 'admin'`.

---

## Scenario 4: A Feature is Broken After an Update

**Symptoms:** A specific tab or feature crashes with a TypeError or shows an error boundary fallback.

**Steps:**

1. **Check the browser console** for the exact error:
   ```bash
   tail -30 .manus-logs/browserConsole.log
   ```

2. **If the error is `useMutation is not a function` or similar:** A tRPC stub is missing from `trpc.standalone.ts`. Run the stub coverage test to identify the gap:
   ```bash
   pnpm test -- --reporter=verbose
   ```
   The `standalone.stub.coverage.test.ts` test will list exactly which stubs are missing.

3. **If the error is a React render crash:** The `TabErrorBoundary` should have caught it and shown a fallback. Check which tab is affected and look for the error in the browser console.

4. **Roll back if needed:** Use the Manus Management UI → Checkpoints → click "Rollback" on the last working checkpoint.

5. **Fix and re-deploy:**
   ```bash
   pnpm test          # verify tests pass
   pnpm build         # verify build succeeds
   pnpm smoke:test    # verify smoke test passes
   pnpm deploy:github-pages
   ```

---

## Scenario 5: Site Lock is Not Working

**Symptoms:** After pressing "Lock Now" in AdminSettings, users can still access the site.

**Steps:**

1. **Verify the lock is active** — in AdminSettings, the lock status card should show "LOCKED" in red. If it shows "Site is Open", the lock was not applied.

2. **Check the database** — in the Manus Database panel, run:
   ```sql
   SELECT * FROM site_settings WHERE key = 'lock_enabled';
   SELECT * FROM site_settings WHERE key = 'lock_start_date';
   ```
   `lock_enabled` should be `"1"` and `lock_start_date` should be a recent timestamp.

3. **If the lock is in the DB but users can still access:** Check that `SiteLockGate` is wrapping the main content in `App.tsx`. Users who are already logged in with a valid session may need to refresh.

4. **If the lock was accidentally unlocked:** Press "Lock Now" again. The unlock button now requires a confirmation dialog to prevent accidental unlocks.

---

## Scenario 6: Deploy to GitHub Pages Failed

**Symptoms:** Running `pnpm deploy:github-pages` fails or the live site does not update.

**Steps:**

1. **Check the build output:**
   ```bash
   pnpm build 2>&1 | tail -20
   ```

2. **Check GitHub authentication:**
   ```bash
   gh auth status
   ```
   If not authenticated, run `gh auth login`.

3. **Check the GitHub repository:**
   ```bash
   git remote -v
   ```
   Verify the `github` remote points to the correct repository.

4. **Force push if the remote is ahead:**
   ```bash
   git push github HEAD:main --force
   ```

5. **Verify the deploy:**
   ```bash
   pnpm smoke:test:live
   ```

---

## Quick Reference

| Situation | Command |
|---|---|
| Run all tests | `pnpm test` |
| TypeScript check | `npx tsc --noEmit` |
| Build production bundle | `pnpm build` |
| Smoke test (local) | `pnpm smoke:test` |
| Smoke test (live) | `pnpm smoke:test:live` |
| Safe DB migration | `node scripts/db-migrate-safe.mjs` |
| Deploy to GitHub Pages | `pnpm deploy:github-pages` |
| View server logs | `tail -50 .manus-logs/devserver.log` |
| View browser errors | `tail -30 .manus-logs/browserConsole.log` |
| View network requests | `tail -30 .manus-logs/networkRequests.log` |
