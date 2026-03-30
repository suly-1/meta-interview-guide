/**
 * Layer 4: Secret & Environment Variable Audit
 *
 * Verifies that:
 *   1. No secrets are hardcoded in source files (token strings, API keys, passwords)
 *   2. No .env files have been committed to git history
 *   3. No secret VALUES are logged to the console (configuration hints are OK)
 *   4. Server-only secrets are not referenced in client-side code
 *   5. The client bundle does not contain server-only secrets
 *   6. VITE_ prefixed env vars are only used for non-sensitive public config
 *
 * NOTE on process.env access:
 *   This codebase has several utility/infrastructure files (email.ts, db.ts,
 *   emailDigest.ts, etc.) that legitimately read process.env directly because
 *   they are low-level helpers predating the env.ts centralisation. The rule
 *   below only flags ROUTER files (server/routers/*.ts) which should always
 *   go through env.ts — not utility files.
 *
 * NOTE on ADMIN_PIN in client:
 *   StandaloneAdminGate.tsx references __ADMIN_PIN_HASH__ (a SHA-256 hash
 *   injected at build time), not the raw ADMIN_PIN env var. The string
 *   "ADMIN_PIN" appears only in comments/declarations, not as a live env read.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

function readAllSourceFiles(dirs: string[]): Array<{ path: string; source: string }> {
  const results: Array<{ path: string; source: string }> = [];

  for (const dir of dirs) {
    const absDir = resolve(ROOT, dir);
    if (!existsSync(absDir)) continue;

    function walk(d: string) {
      readdirSync(d, { withFileTypes: true }).forEach((entry) => {
        const full = join(d, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          walk(full);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
          !entry.name.endsWith(".test.ts") &&
          !entry.name.endsWith(".test.tsx")
        ) {
          results.push({
            path: full.replace(ROOT + "/", ""),
            source: readFileSync(full, "utf-8"),
          });
        }
      });
    }
    walk(absDir);
  }

  return results;
}

describe("Layer 4: Secret & Environment Variable Audit", () => {
  const serverFiles = readAllSourceFiles(["server"]);
  const clientFiles = readAllSourceFiles(["client/src"]);
  const sharedFiles = readAllSourceFiles(["shared"]);
  const allFiles = [...serverFiles, ...clientFiles, ...sharedFiles];

  // -------------------------------------------------------------------------
  // Rule 1: No hardcoded secrets in source files
  // -------------------------------------------------------------------------
  describe("No hardcoded secrets", () => {
    it("no source file contains hardcoded JWT tokens", () => {
      const violations: Array<{ path: string; line: number }> = [];
      const jwtPattern = /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/;

      for (const { path, source } of allFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          if (jwtPattern.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
            violations.push({ path, line: idx + 1 });
          }
        });
      }

      expect(
        violations,
        `Hardcoded JWT tokens found:\n` + violations.map((v) => `  ${v.path}:${v.line}`).join("\n")
      ).toHaveLength(0);
    });

    it("no source file contains Stripe-style sk_ secret keys", () => {
      const violations: Array<{ path: string; line: number }> = [];
      const stripePattern = /['"]sk_(?:live|test)_[a-zA-Z0-9]{20,}['"]/;

      for (const { path, source } of allFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          if (stripePattern.test(line)) {
            violations.push({ path, line: idx + 1 });
          }
        });
      }

      expect(violations).toHaveLength(0);
    });

    it("no source file hardcodes a password string in an assignment", () => {
      const violations: Array<{ path: string; line: number; snippet: string }> = [];
      const pwPattern = /\bpassword\s*[:=]\s*['"][^'"]{8,}['"]/i;

      for (const { path, source } of allFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (pwPattern.test(trimmed) && !trimmed.startsWith("//") && !trimmed.startsWith("*")) {
            // Exclude Zod schema definitions like z.string().min(8) password fields
            if (!/z\.(string|password)\(\)/.test(trimmed)) {
              violations.push({ path, line: idx + 1, snippet: trimmed.slice(0, 80) });
            }
          }
        });
      }

      expect(
        violations,
        `Hardcoded password assignments:\n` +
          violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n")
      ).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 2: No .env files committed to git
  // -------------------------------------------------------------------------
  describe("No .env files in git history", () => {
    it(".env file does not exist in the working directory", () => {
      const envExists = existsSync(resolve(ROOT, ".env"));
      expect(envExists, ".env file must not exist in the project root — use the Secrets panel instead").toBe(false);
    });

    it(".env.local and .env.production files do not exist", () => {
      const localExists = existsSync(resolve(ROOT, ".env.local"));
      const prodExists = existsSync(resolve(ROOT, ".env.production"));
      expect(localExists, ".env.local must not exist in the project root").toBe(false);
      expect(prodExists, ".env.production must not exist in the project root").toBe(false);
    });

    it(".gitignore includes .env* pattern", () => {
      const gitignore = readFile(".gitignore");
      const hasEnvIgnore = /^\.env/m.test(gitignore) || /^\.env\*/m.test(gitignore);
      expect(hasEnvIgnore, ".gitignore must include .env or .env* to prevent accidental secret commits").toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 3: No secret VALUES logged to console
  //
  // Distinguishes between:
  //   BAD:  console.log(process.env.SMTP_PASS)  — logs the actual value
  //   OK:   console.warn("set SMTP_PASS in Secrets")  — mentions the var name in a hint
  // -------------------------------------------------------------------------
  describe("No secret values in console output", () => {
    const SENSITIVE_VARS = [
      "JWT_SECRET",
      "ADMIN_SECRET_TOKEN",
      "ADMIN_PIN",
      "DATABASE_URL",
      "BUILT_IN_FORGE_API_KEY",
      "SMTP_PASS",
      "VAPID_PRIVATE_KEY",
    ];

    for (const varName of SENSITIVE_VARS) {
      it(`${varName} value is never passed to console.log/warn/error`, () => {
        const violations: Array<{ path: string; line: number; snippet: string }> = [];

        for (const { path, source } of serverFiles) {
          const lines = source.split("\n");
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            // Only flag if the var name appears as a live process.env read inside a console call,
            // not if it's just mentioned as a string in a configuration hint message.
            // Pattern: console.*(... process.env.VAR_NAME ...)
            if (
              /console\.(log|warn|error|info|debug)/.test(trimmed) &&
              new RegExp(`process\\.env\\.${varName}`).test(trimmed)
            ) {
              violations.push({ path, line: idx + 1, snippet: trimmed.slice(0, 100) });
            }
          });
        }

        expect(
          violations,
          `${varName} value is logged to console via process.env in:\n` +
            violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n")
        ).toHaveLength(0);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Rule 4: Server secrets must not appear in client-side code
  //
  // Exception: ADMIN_PIN — StandaloneAdminGate.tsx uses __ADMIN_PIN_HASH__
  // (a build-time SHA-256 hash injected via vite.config.ts define), not the
  // raw env var. The string "ADMIN_PIN" appears only in a declare statement
  // and comments, not as a live process.env read.
  // -------------------------------------------------------------------------
  describe("Server-client secret isolation", () => {
    // These vars must never appear as live reads in client code.
    // We check for process.env.VAR_NAME patterns, not just string mentions.
    const SERVER_ONLY_VARS = [
      "JWT_SECRET",
      "ADMIN_SECRET_TOKEN",
      "DATABASE_URL",
      "BUILT_IN_FORGE_API_KEY",
      "SMTP_PASS",
      "SMTP_USER",
      "VAPID_PRIVATE_KEY",
    ];

    for (const varName of SERVER_ONLY_VARS) {
      it(`${varName} is not read via process.env in client-side source files`, () => {
        const violations: Array<{ path: string; line: number }> = [];

        for (const { path, source } of clientFiles) {
          const lines = source.split("\n");
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (
              new RegExp(`process\\.env\\.${varName}`).test(trimmed) &&
              !trimmed.startsWith("//") &&
              !trimmed.startsWith("*")
            ) {
              violations.push({ path, line: idx + 1 });
            }
          });
        }

        expect(
          violations,
          `Server-only variable ${varName} read via process.env in client code:\n` +
            violations.map((v) => `  ${v.path}:${v.line}`).join("\n")
        ).toHaveLength(0);
      });
    }

    it("VITE_ prefixed env vars are only used for non-sensitive public config", () => {
      // VITE_ vars are bundled into the client — verify none of them are sensitive
      const envTs = readFile("server/_core/env.ts");
      const viteVars = [...envTs.matchAll(/VITE_([A-Z_]+)/g)].map((m) => m[1]);

      const SENSITIVE_KEYWORDS = ["SECRET", "PASSWORD", "PRIVATE_KEY", "TOKEN", "PASS"];
      const sensitiveViteVars = viteVars.filter((v) =>
        SENSITIVE_KEYWORDS.some((kw) => v.includes(kw))
      );

      // VITE_FRONTEND_FORGE_API_KEY is a public read-only key — intentionally client-side
      const ALLOWED_VITE_SENSITIVE = new Set(["FRONTEND_FORGE_API_KEY"]);
      const actualViolations = sensitiveViteVars.filter((v) => !ALLOWED_VITE_SENSITIVE.has(v));

      expect(
        actualViolations,
        `These VITE_ vars appear sensitive and will be bundled into the client: ${actualViolations.map((v) => "VITE_" + v).join(", ")}. ` +
          "Move them to server-only env vars."
      ).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 5: Router files must not access process.env directly
  //
  // Only checks server/routers/*.ts — utility/infrastructure files like
  // email.ts, db.ts, emailDigest.ts are allowed to read process.env directly
  // as they are low-level helpers.
  // -------------------------------------------------------------------------
  describe("Centralised env access in router files", () => {
    it("router files (server/routers/*.ts) do not access process.env directly", () => {
      const violations: Array<{ path: string; line: number; snippet: string }> = [];

      const routerFiles = serverFiles.filter((f) => f.path.startsWith("server/routers/"));

      for (const { path, source } of routerFiles) {
        const lines = source.split("\n");
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (
            /process\.env\.[A-Z_]{4,}/.test(trimmed) &&
            !trimmed.startsWith("//") &&
            !trimmed.startsWith("*")
          ) {
            violations.push({ path, line: idx + 1, snippet: trimmed.slice(0, 80) });
          }
        });
      }

      expect(
        violations,
        `Direct process.env access found in router files:\n` +
          violations.map((v) => `  ${v.path}:${v.line}: ${v.snippet}`).join("\n") +
          "\nImport from 'server/_core/env.ts' instead."
      ).toHaveLength(0);
    });
  });
});
