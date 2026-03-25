# RUNBOOK — meta-prep-guide (MetaEng Guide)

This runbook covers the three most likely failure scenarios and provides exact commands to recover from each. Keep this file open during any deploy or schema change.

---

## Quick Reference

| Scenario                       | Trigger                           | Recovery Time | Section                                                               |
| ------------------------------ | --------------------------------- | ------------- | --------------------------------------------------------------------- |
| Bad deploy to metaengguide.pro | Manus publish breaks the app      | ~2 min        | [Scenario 1](#scenario-1-bad-deploy-to-metaengguideprosite-is-broken) |
| DB error after migration       | `pnpm db:push` crashes the server | ~5 min        | [Scenario 2](#scenario-2-db-error-after-migration)                    |
| LLM outage                     | AI features return errors         | Instant       | [Scenario 3](#scenario-3-llm-outage-ai-features-stop-working)         |

---

## Scenario 1: Bad Deploy to metaengguide.pro (Site is Broken)

**Symptoms:** Users see a blank page, 500 error, or broken UI after you clicked Publish.

### Step 1 — Identify the last good checkpoint

Open the Manus Management UI → **Dashboard** panel. You will see a list of checkpoints with timestamps. Identify the last checkpoint that was working correctly.

### Step 2 — Roll back via the Manus UI

1. In the Management UI, find the last good checkpoint in the list.
2. Click the **Rollback** button next to that checkpoint.
3. Wait ~30 seconds for the rollback to complete.
4. Click **Publish** to push the rolled-back version live.

### Step 3 — Verify recovery

```bash
# Run the smoke test against the live site to confirm it's healthy
npx tsx scripts/smoke-test.ts https://metaengguide.pro
```

### Step 4 — Diagnose the bad deploy

```bash
# Check server logs for the error that caused the crash
tail -100 .manus-logs/devserver.log | grep -i "error\|crash\|fatal"

# Check browser console errors
tail -50 .manus-logs/browserConsole.log

# Run TypeScript check
npx tsc --noEmit

# Run all tests
pnpm test
```

---

## Scenario 2: DB Error After Migration

**Symptoms:** After running `pnpm db:push` or `pnpm db:migrate-safe`, the server crashes with a database error. All tRPC procedures fail.

### Step 1 — Check what migration ran

```bash
# See the last migration that was applied
cat drizzle/meta/_journal.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['entries'][-1])"

# See the SQL that was generated
ls -lt drizzle/migrations/*.sql | head -5
cat drizzle/migrations/<latest-file>.sql
```

### Step 2 — Check the error

```bash
# Check server logs for the exact DB error
tail -50 .manus-logs/devserver.log | grep -i "error\|sql\|column\|table"
```

### Step 3 — Common fixes

**Error: "Column 'X' cannot be null"**

```sql
-- The new column needs a DEFAULT value. Edit the migration SQL to add one:
ALTER TABLE your_table ADD COLUMN new_col VARCHAR(255) NOT NULL DEFAULT '';
-- Then re-run: pnpm db:push
```

**Error: "Table 'X' already exists"**

```bash
# The migration journal is out of sync. Check the journal:
cat drizzle/meta/_journal.json
# If the migration is listed but the table doesn't exist, remove the entry and re-run.
```

**Error: "Unknown column 'X' in field list"**

```bash
# A procedure references a column that doesn't exist yet.
# Check which migration added it and whether it ran:
grep -r "column_name" drizzle/migrations/
```

### Step 4 — Rollback via Manus UI (nuclear option)

If the migration cannot be fixed quickly:

1. Open Manus Management UI → **Database** panel.
2. Use the database backup feature to restore the last known-good backup.
3. Roll back the code checkpoint to before the schema change (see Scenario 1).
4. Fix the schema in `drizzle/schema.ts` and re-run `pnpm db:migrate-safe`.

### Step 5 — Verify recovery

```bash
# Restart the dev server
# Then run the full test suite
pnpm test

# Check the server is responding
curl -s http://localhost:3000/api/trpc/siteAccess.checkAccess | python3 -m json.tool
```

---

## Scenario 3: LLM Outage (AI Features Stop Working)

**Symptoms:** AI features (sentiment tagging, AI chat, coding analysis, etc.) return errors or show loading spinners indefinitely.

### Immediate Response

**No action required for sentiment tagging.** The `withLLMFallback` wrapper in `server/_core/llm.ts` automatically:

- Times out after 12–15 seconds
- Returns a safe fallback value (e.g., `"neutral"` for sentiment)
- Logs the error to `devserver.log` without crashing the server

Users will see the AI feature degrade gracefully — feedback still saves, just without sentiment tags.

### For other AI features (AI chat, analysis, etc.)

```bash
# Check if the LLM API is reachable
curl -s -o /dev/null -w "%{http_code}" https://forge.manus.im/v1/chat/completions \
  -H "Authorization: Bearer $BUILT_IN_FORGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"ping"}]}'
# Expected: 200. If 429: rate limited. If 503: API outage.
```

### If the outage is prolonged

1. Check the Manus status page for API outage announcements.
2. To disable AI features temporarily, set the feature flag:
   ```bash
   # In Manus Secrets panel, add:
   VITE_FEATURE_AI_CHAT=false
   VITE_FEATURE_AI_ANALYSIS=false
   ```
   Then use the `FeatureFlag` component in the UI to gate AI features:
   ```tsx
   <FeatureFlag
     name="ai_chat"
     fallback={<p>AI features temporarily unavailable.</p>}
   >
     <AIChatBox />
   </FeatureFlag>
   ```

### Verify recovery

```bash
# Test the LLM endpoint directly
npx tsx -e "
import { invokeLLM } from './server/_core/llm.ts';
const r = await invokeLLM({ messages: [{ role: 'user', content: 'say hello' }] });
console.log(r.choices[0].message.content);
"
```

---

## General Health Checks

Run these after any significant change:

```bash
# 1. TypeScript — zero errors required
npx tsc --noEmit

# 2. Full test suite — all 61 tests must pass
pnpm test

# 3. Smoke test against live site
npx tsx scripts/smoke-test.ts https://metaengguide.pro

# 4. Smoke test against local dev server
npx tsx scripts/smoke-test.ts http://localhost:3000

# 5. Security audit — no moderate+ vulnerabilities
pnpm audit:check
```

---

## Contacts & Resources

| Resource            | URL                              |
| ------------------- | -------------------------------- |
| Live site           | https://metaengguide.pro         |
| Static mirror       | https://www.metaguide.blog       |
| Manus Management UI | Available via the Manus platform |
| Manus help          | https://help.manus.im            |

---

_Last updated: 2026-03-25_
