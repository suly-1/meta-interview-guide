/**
 * email.ts — SMTP email helper.
 *
 * Reads SMTP credentials from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DIGEST_RECIPIENT_EMAIL
 *
 * Falls back to the Manus notifyOwner channel if SMTP is not configured.
 */

import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Send an email via SMTP.
 * Returns true on success, false if SMTP is not configured or send fails.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const transport = createTransport();
  if (!transport) {
    console.warn("[Email] SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in Secrets.");
    return false;
  }

  try {
    const info = await transport.sendMail({
      from: `"MetaEngGuide" <${process.env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.log("[Email] Sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

/** Returns true if SMTP is fully configured */
export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
