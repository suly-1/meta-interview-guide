/**
 * SMTP credentials validation test
 * Verifies that the configured SMTP credentials can connect to Gmail
 */
import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP credentials", () => {
  it("should successfully verify Gmail SMTP connection", async () => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT ?? "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Skip if not configured (CI environment)
    if (!host || !user || !pass) {
      console.log("[SMTP Test] Skipped: SMTP env vars not set");
      return;
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // verify() checks the connection and auth without sending an email
    const result = await transport.verify();
    expect(result).toBe(true);
  }, 15000);
});
