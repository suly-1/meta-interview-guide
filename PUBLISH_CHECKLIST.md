# Publish Checklist — Meta Prep Guide

Run every item in order before clicking **Publish** in the Management UI.
A single failing step is a hard stop — do not publish until it is resolved.

---

## 1. Run the full test suite (mandatory)

```bash
cd /home/ubuntu/meta-prep-guide
pnpm test
```

**Expected output:**

```
Test Files  N passed (N)
     Tests  N passed (N)   ← must be ≥ 369 stubs + all other tests, 0 failed
```

Why this matters:

- The stub test (`client/src/test/pages.render.test.tsx`) verifies that every
  tRPC procedure added during a feature build has a matching entry in the
  standalone mock (`client/src/lib/trpc.standalone.ts`).
- A missing stub causes a silent runtime crash the first time a user hits that
  procedure on the deployed site.
- The useUtils invalidation test verifies every namespace and key used in
  `utils.*.invalidate()` calls exists in the mock, preventing silent no-ops.

If any test fails:

1. Read the failure output carefully — it names the missing procedure or key.
2. Add the stub to `client/src/lib/trpc.standalone.ts`.
3. Re-run `pnpm test` until all tests are green.
4. Continue to step 2.

---

## 2. Prettier check

```bash
pnpm format
```

Fix any formatting issues before proceeding.

---

## 3. TypeScript check

```bash
npx tsc --noEmit
```

Zero errors required.

---

## 4. Save a checkpoint

Use `webdev_save_checkpoint` (or the Management UI checkpoint button).
The checkpoint is the artifact that gets published — you cannot publish without one.

---

## 5. Click Publish in the Management UI

Open the Management UI → click the **Publish** button in the top-right header.
The latest checkpoint will be deployed to `metaengguide.pro` within ~90 seconds.

---

## Post-publish smoke test

After ~90 seconds, verify on the live site:

- [ ] `https://metaengguide.pro/` loads the invite-code gate (not a Manus login screen)
- [ ] Entering the correct invite code opens the guide
- [ ] `/admin` prompts for the admin PIN
- [ ] At least one tRPC query (e.g. Overview tab stats) loads without a console error
