/**
 * email.test.ts — validates that the SMTP helper reads env vars correctly
 * and that isSmtpConfigured() returns the right value.
 * Does NOT actually send an email (avoids network calls in CI).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("email helper", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env after each test
    Object.keys(process.env).forEach(k => delete process.env[k]);
    Object.assign(process.env, originalEnv);
  });

  it("isSmtpConfigured returns false when SMTP vars are missing", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    // Re-import to pick up env changes
    const { isSmtpConfigured } = await import("./email");
    // Without the env vars the function should return false
    expect(isSmtpConfigured()).toBe(false);
  });

  it("DIGEST_RECIPIENT_EMAIL is set in the environment", () => {
    // This test verifies the secret was injected by the platform
    const email = process.env.DIGEST_RECIPIENT_EMAIL;
    expect(email).toBeTruthy();
    expect(email).toContain("@");
  });
});
