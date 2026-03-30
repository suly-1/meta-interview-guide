/**
 * Layer 3: Input Validation & Injection Audit
 *
 * Verifies that:
 *   1. Every mutation procedure has a Zod input schema (.input(z.*))
 *   2. No raw SQL string interpolation exists (template literals inside sql`` or db.execute())
 *   3. No user-supplied values are concatenated into SQL strings
 *   4. All external inputs go through Zod before reaching the database layer
 *
 * This test is a static analysis pass over the source files — it does not
 * execute any procedures. It catches the most common injection patterns.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

function readAllServerFiles(): Array<{ path: string; source: string }> {
  const results: Array<{ path: string; source: string }> = [];

  // Main routers.ts
  results.push({ path: "server/routers.ts", source: readFile("server/routers.ts") });

  // All files in server/routers/
  const routerDir = resolve(ROOT, "server/routers");
  readdirSync(routerDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .forEach((f) => {
      results.push({
        path: `server/routers/${f}`,
        source: readFileSync(join(routerDir, f), "utf-8"),
      });
    });

  // server/db.ts
  results.push({ path: "server/db.ts", source: readFile("server/db.ts") });

  return results;
}

/** Extract all mutation procedure names from a source file */
function extractMutationNames(source: string): string[] {
  const names: string[] = [];
  const re = /([a-zA-Z_][a-zA-Z0-9_]*):\s+(?:public|protected|tokenAdmin|admin|owner)Procedure(?:\.[a-zA-Z]+\([^)]*\))*\.mutation/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    names.push(m[1]);
  }
  return names;
}

/** Check if a mutation has a .input(z.*) call before .mutation( */
function mutationHasZodInput(source: string, mutationName: string): boolean {
  // Find the block starting at the mutation definition
  const startIdx = source.indexOf(`${mutationName}:`);
  if (startIdx === -1) return false;
  const block = source.slice(startIdx, startIdx + 2000);
  // Check for .input(z. before .mutation(
  const inputIdx = block.indexOf(".input(z.");
  const mutationIdx = block.indexOf(".mutation(");
  if (inputIdx === -1) return false;
  return inputIdx < mutationIdx;
}

describe("Layer 3: Input Validation & Injection Audit", () => {
  const allFiles = readAllServerFiles();

  // -------------------------------------------------------------------------
  // Rule 1: All mutation procedures must have Zod input schemas
  // -------------------------------------------------------------------------
  describe("Zod input validation on mutations", () => {
    // Mutations that are intentionally input-free (no user data, owner-only triggers)
    const EXEMPT_MUTATIONS = new Set([
      // Auth / session — uses cookie context, no body
      "logout",
      // Disclaimer — uses ctx.user from session, no body input
      "acknowledge",
      // Panic button — no parameters, just a trigger action
      "lockNow",
      "unlock",
      // Admin triggers with no user-supplied data
      "triggerDigest",
      "triggerDailyAlert",
      "markAllNew",
      "sendReportNow",
      "resetClock",
      "cohortReset",
      "checkInactiveUsers",
      "processExpiredBlocks",
      "purgeOldSessions",
      "exportAuditLogCsv",
    ]);

    for (const { path, source } of allFiles) {
      const mutations = extractMutationNames(source);
      if (mutations.length === 0) continue;

      describe(`Router: ${path}`, () => {
        for (const name of mutations) {
          if (EXEMPT_MUTATIONS.has(name)) {
            it(`${name} is exempt (no user input expected)`, () => {
              expect(true).toBe(true);
            });
            continue;
          }

          it(`${name} has a .input(z.*) Zod schema`, () => {
            const hasInput = mutationHasZodInput(source, name);
            expect(
              hasInput,
              `Mutation "${name}" in ${path} is missing a .input(z.*) Zod schema. ` +
                "All mutations that accept user data must validate inputs with Zod."
            ).toBe(true);
          });
        }
      });
    }
  });

  // -------------------------------------------------------------------------
  // Rule 2: No raw SQL string interpolation
  // -------------------------------------------------------------------------
  describe("SQL injection prevention", () => {
    it("no file uses template literal interpolation inside sql`` tagged templates", () => {
      const violations: Array<{ path: string; line: number; snippet: string }> = [];

      for (const { path, source } of allFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          // Detect sql`...${variable}...` patterns (raw interpolation in SQL)
          // Allow: sql`SELECT * FROM table` (no interpolation)
          // Flag: sql`SELECT * FROM ${tableName}` or sql`WHERE id = ${userId}`
          if (/\bsql`[^`]*\$\{/.test(line)) {
            violations.push({ path, line: idx + 1, snippet: line.trim() });
          }
        });
      }

      expect(
        violations,
        `SQL template literal interpolation found (potential injection):\n` +
          violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n") +
          "\nUse Drizzle's parameterised query builder instead."
      ).toHaveLength(0);
    });

    it("no file uses db.execute() with string concatenation", () => {
      const violations: Array<{ path: string; line: number; snippet: string }> = [];

      for (const { path, source } of allFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          // Detect db.execute("..." + variable) or db.execute(`...${variable}`)
          if (/db\.execute\s*\(\s*[`"'].*\+/.test(line) || /db\.execute\s*\(\s*`[^`]*\$\{/.test(line)) {
            violations.push({ path, line: idx + 1, snippet: line.trim() });
          }
        });
      }

      expect(
        violations,
        `db.execute() with string concatenation found (potential injection):\n` +
          violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n")
      ).toHaveLength(0);
    });

    it("no file uses string concatenation to build WHERE clauses", () => {
      const violations: Array<{ path: string; line: number; snippet: string }> = [];

      for (const { path, source } of allFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          // Detect patterns like: "WHERE " + variable or `WHERE ${variable}`
          if (/["'`]WHERE\s+["'`]\s*\+/.test(line) || /WHERE\s+\$\{/.test(line)) {
            violations.push({ path, line: idx + 1, snippet: line.trim() });
          }
        });
      }

      expect(
        violations,
        `Raw WHERE clause string building found:\n` +
          violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n")
      ).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 3: Zod schemas must use strict types (no z.any() in mutations)
  // -------------------------------------------------------------------------
  describe("Zod schema strictness", () => {
    it("no mutation input schema uses z.any() (bypasses type safety)", () => {
      const violations: Array<{ path: string; line: number; snippet: string }> = [];

      // Known legitimate uses of z.any() — explicitly reviewed and accepted:
      //   server/routers/collab.ts — saveEvent.payload: arbitrary JSON for session replay,
      //   not used in SQL queries, stored as JSON blob only.
      const EXEMPT_ANY_CONTEXTS = new Set([
        "server/routers/collab.ts",
      ]);

      for (const { path, source } of allFiles) {
        if (EXEMPT_ANY_CONTEXTS.has(path)) continue;
        const lines = source.split("\n");
        let inInputBlock = false;
        let depth = 0;

        lines.forEach((line, idx) => {
          if (/\.input\(z\./.test(line)) {
            inInputBlock = true;
            depth = 0;
          }
          if (inInputBlock) {
            depth += (line.match(/\(/g) || []).length;
            depth -= (line.match(/\)/g) || []).length;
            if (/z\.any\(\)/.test(line)) {
              violations.push({ path, line: idx + 1, snippet: line.trim() });
            }
            if (depth <= 0 && inInputBlock) {
              inInputBlock = false;
            }
          }
        });
      }

      expect(
        violations,
        `z.any() found in mutation input schemas:\n` +
          violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n") +
          "\nUse specific Zod types to enforce input validation."
      ).toHaveLength(0);
    });

    it("invite code creation validates code format (min length enforced)", () => {
      const source = readFile("server/routers/inviteGate.ts");
      // createCode must have a min() constraint on the code field
      const createBlock = source.match(/createCode[\s\S]{0,500}?\.mutation/)?.[0] ?? "";
      const hasMinLength = /z\.string\(\)\.min\(|\.min\(\d+\)/.test(createBlock);
      expect(
        hasMinLength,
        "createCode must enforce a minimum length on the invite code string to prevent empty codes."
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 4: Rate-limiting sensitive endpoints
  // -------------------------------------------------------------------------
  describe("Sensitive endpoint protection", () => {
    it("adminPin.verifyPin has brute-force protection (checks attempt count before verifying)", () => {
      const source = readFile("server/routers/adminPin.ts");
      const verifyBlock = source.match(/verifyPin[\s\S]{0,2000}?(?=\n  [a-zA-Z])/)?.[0] ?? "";
      // Must check attempt count or lock status before comparing the PIN
      const hasAttemptCheck =
        /attempt|lockout|locked|maxAttempts|failCount|pinLock/.test(verifyBlock);
      expect(
        hasAttemptCheck,
        "adminPin.verifyPin must check attempt count / lockout status before verifying the PIN."
      ).toBe(true);
    });

    it("adminPin.verifyPin does not compare PIN to an empty string", () => {
      const source = readFile("server/routers/adminPin.ts");
      const verifyBlock = source.match(/verifyPin[\s\S]{0,2000}?(?=\n  [a-zA-Z])/)?.[0] ?? "";
      // Ensure PIN is not compared to an empty string (would allow bypass with empty env var)
      const comparesToEmpty = /pin\s*===?\s*["']{2}|["']{2}\s*===?\s*pin/.test(verifyBlock);
      expect(comparesToEmpty, "PIN must not be compared to an empty string").toBe(false);
    });
  });
});
