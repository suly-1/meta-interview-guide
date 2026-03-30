/**
 * Layer 2: Data Exposure Audit
 *
 * Verifies that procedures do not leak private fields and that IP addresses
 * are masked server-side (not just in the UI). Also checks that admin-only
 * queries are not reachable via public procedures.
 *
 * Rules enforced:
 *   1. Full IP addresses must never be returned raw — masking must happen server-side.
 *   2. Session tokens must never be returned in list responses.
 *   3. Admin PIN hash / raw PIN must never appear in any response.
 *   4. JWT_SECRET and ADMIN_SECRET_TOKEN must never be logged or returned.
 *   5. The active_sessions listActiveSessions procedure must mask IPs.
 *   6. The adminPin router must not expose raw pin values in responses.
 *   7. No procedure should return a raw `password` or `secret` field.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, join } from "path";
import { readdirSync } from "fs";

const ROOT = resolve(__dirname, "..");

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

function readAllRouters(): Array<{ path: string; source: string }> {
  const routerDir = resolve(ROOT, "server/routers");
  const files = readdirSync(routerDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
  const result = files.map((f) => ({
    path: `server/routers/${f}`,
    source: readFileSync(join(routerDir, f), "utf-8"),
  }));
  // Also include the main routers.ts
  result.push({
    path: "server/routers.ts",
    source: readFile("server/routers.ts"),
  });
  return result;
}

describe("Layer 2: Data Exposure Audit", () => {
  const allRouters = readAllRouters();

  // -------------------------------------------------------------------------
  // Rule 1: IP addresses must be masked before being returned
  // -------------------------------------------------------------------------
  describe("IP address masking", () => {
    it("listActiveSessions masks IP addresses server-side (not raw ipAddress field)", () => {
      const source = readFile("server/routers/inviteGate.ts");
      // The procedure must contain a masking operation (replace or slice or mask)
      // Look for the listActiveSessions function body
      const listBlock = source.match(/listActiveSessions[\s\S]{0,2000}?(?=\n  [a-zA-Z])/)?.[0] ?? "";
      const hasMasking =
        /\.replace\(|\.slice\(|maskIp|maskedIp|\.split\(.*\.\.\.|ipAddress.*replace|replace.*ipAddress/.test(listBlock);
      expect(
        hasMasking,
        "listActiveSessions must mask IP addresses server-side before returning them. " +
          "Use a pattern like: ip.replace(/\\.\\d+$/, '.***') or similar."
      ).toBe(true);
    });

    it("no router returns a raw ctx.ip or req.ip field directly in a response object", () => {
      const violations: string[] = [];
      for (const { path, source } of allRouters) {
        // Look for patterns that directly spread or return ip fields without masking
        if (/return\s*\{[^}]*\bip\b\s*:/.test(source) || /ip:\s*ctx\.ip/.test(source) || /ip:\s*req\.ip/.test(source)) {
          violations.push(path);
        }
      }
      expect(
        violations,
        `These routers return raw IP fields: ${violations.join(", ")}. Mask before returning.`
      ).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 2: Session tokens must not be returned in list responses
  // -------------------------------------------------------------------------
  describe("Session token exposure", () => {
    it("listActiveSessions does not return the raw sessionToken in its response", () => {
      const source = readFile("server/routers/inviteGate.ts");
      // Find the listActiveSessions return block — sessionToken should not be in the mapped output
      const listBlock = source.match(/listActiveSessions[\s\S]{0,3000}?(?=\n  [a-zA-Z])/)?.[0] ?? "";
      // It's OK to SELECT sessionToken from DB for matching, but it must not appear in the return map
      // Check that the return object does not include sessionToken as a key
      const returnBlock = listBlock.match(/return\s+sessions\.map[\s\S]*?\}\)/)?.[0] ?? "";
      const exposesToken = /sessionToken\s*:/.test(returnBlock);
      expect(
        exposesToken,
        "listActiveSessions must not include sessionToken in its return map — it is an internal identifier."
      ).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 3: Admin PIN must never be returned in any response
  // -------------------------------------------------------------------------
  describe("Admin PIN protection", () => {
    it("adminPin router does not return the raw PIN value in any response", () => {
      const source = readFile("server/routers/adminPin.ts");
      // The PIN is stored as ADMIN_PIN env var — it must never appear in a return statement
      const hasRawPinReturn = /return\s*\{[^}]*\bpin\b\s*:/.test(source);
      expect(
        hasRawPinReturn,
        "adminPin router must not return a raw 'pin' field in any response."
      ).toBe(false);
    });

    it("no router imports or logs ADMIN_PIN or ADMIN_SECRET_TOKEN directly", () => {
      const violations: string[] = [];
      for (const { path, source } of allRouters) {
        if (/console\.(log|warn|error|info).*ADMIN_PIN|console\.(log|warn|error|info).*ADMIN_SECRET/.test(source)) {
          violations.push(path);
        }
      }
      expect(
        violations,
        `These routers log sensitive env vars: ${violations.join(", ")}`
      ).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 4: No procedure returns a 'password' or 'secret' field
  // -------------------------------------------------------------------------
  describe("Password and secret field protection", () => {
    it("no router returns a 'password' field in a response object", () => {
      const violations: string[] = [];
      for (const { path, source } of allRouters) {
        if (/return\s*\{[^}]*\bpassword\b\s*:/.test(source)) {
          violations.push(path);
        }
      }
      expect(
        violations,
        `These routers return a 'password' field: ${violations.join(", ")}`
      ).toHaveLength(0);
    });

    it("no router returns a 'secret' field in a response object", () => {
      const violations: string[] = [];
      for (const { path, source } of allRouters) {
        // Allow 'adminSecret' pattern check but not raw 'secret:' in return
        if (/return\s*\{[^}]*(?<![a-zA-Z])secret\b\s*:/.test(source)) {
          violations.push(path);
        }
      }
      expect(
        violations,
        `These routers return a 'secret' field: ${violations.join(", ")}`
      ).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 5: env.ts must not expose secrets via a public procedure
  // -------------------------------------------------------------------------
  describe("Environment variable protection", () => {
    it("env.ts does not export JWT_SECRET or ADMIN_SECRET_TOKEN as plain values", () => {
      const source = readFile("server/_core/env.ts");
      // These should be used internally but not re-exported as plain string values
      // It's fine to read them from process.env, but not to export them as named constants
      const exportsJwtSecret = /export\s+const\s+JWT_SECRET\s*=/.test(source);
      const exportsAdminToken = /export\s+const\s+ADMIN_SECRET_TOKEN\s*=/.test(source);
      expect(exportsJwtSecret, "env.ts must not export JWT_SECRET as a named constant").toBe(false);
      expect(exportsAdminToken, "env.ts must not export ADMIN_SECRET_TOKEN as a named constant").toBe(false);
    });

    it("server index.ts does not log any environment variable values on startup", () => {
      const source = readFile("server/_core/index.ts");
      const logsEnvValue =
        /console\.(log|info)\s*\(.*process\.env\.[A-Z_]+/.test(source) ||
        /console\.(log|info)\s*\(.*env\.[A-Z_]+/.test(source);
      expect(
        logsEnvValue,
        "server/_core/index.ts must not log environment variable values — they may contain secrets."
      ).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 6: Admin-only data must not be accessible via public procedures
  // -------------------------------------------------------------------------
  describe("Admin data isolation", () => {
    it("feedback.getRecent (public) does not return submitter email or IP", () => {
      const source = readFile("server/routers/feedback.ts");
      // Find the getRecent procedure block
      const getRecentBlock = source.match(/getRecent[\s\S]{0,1000}?(?=\n  [a-zA-Z])/)?.[0] ?? "";
      const exposesEmail = /email\s*:/.test(getRecentBlock);
      const exposesIp = /\bip\b\s*:/.test(getRecentBlock);
      expect(exposesEmail, "feedback.getRecent (public) must not return email addresses").toBe(false);
      expect(exposesIp, "feedback.getRecent (public) must not return IP addresses").toBe(false);
    });

    it("analytics.featureClicksToday (public) does not return user-identifying data", () => {
      const source = readFile("server/routers/analytics.ts");
      const block = source.match(/featureClicksToday[\s\S]{0,800}?(?=\n  [a-zA-Z])/)?.[0] ?? "";
      const exposesUserId = /userId\s*:/.test(block);
      const exposesIp = /\bip\b\s*:/.test(block);
      expect(exposesUserId, "featureClicksToday must not return userId").toBe(false);
      expect(exposesIp, "featureClicksToday must not return IP").toBe(false);
    });
  });
});
