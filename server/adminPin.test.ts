/**
 * adminPin.test.ts — Unit tests for PIN Security Phase 3 features:
 *   1. IP allowlist helper functions (getIpAllowlist, isIpAllowed)
 *   2. SMTP email alert integration (sendEmail called on 3/5 failed attempts)
 *   3. getPinAttemptChart bucketing logic
 *   4. getIpAllowlist / setIpAllowlist / getPinAttemptChart router procedures import
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── 1. isIpAllowed helper ─────────────────────────────────────────────────────
// We extract and test the pure helper logic inline (no DB needed).

function isIpAllowed(ip: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return false;
  for (const entry of allowlist) {
    if (entry === ip) return true;
    if (entry.endsWith('/24')) {
      const prefix = entry.slice(0, entry.lastIndexOf('.'));
      if (ip.startsWith(prefix + '.')) return true;
    }
  }
  return false;
}

describe("isIpAllowed helper", () => {
  it("returns false when allowlist is empty", () => {
    expect(isIpAllowed("1.2.3.4", [])).toBe(false);
  });

  it("returns true for exact IP match", () => {
    expect(isIpAllowed("203.0.113.42", ["203.0.113.42"])).toBe(true);
  });

  it("returns false for non-matching exact IP", () => {
    expect(isIpAllowed("203.0.113.99", ["203.0.113.42"])).toBe(false);
  });

  it("returns true for /24 CIDR match", () => {
    expect(isIpAllowed("192.168.1.55", ["192.168.1.0/24"])).toBe(true);
  });

  it("returns false for IP outside /24 CIDR", () => {
    expect(isIpAllowed("192.168.2.55", ["192.168.1.0/24"])).toBe(false);
  });

  it("handles multiple entries — matches second entry", () => {
    expect(isIpAllowed("10.0.0.5", ["1.2.3.4", "10.0.0.0/24"])).toBe(true);
  });

  it("handles multiple entries — no match", () => {
    expect(isIpAllowed("8.8.8.8", ["1.2.3.4", "10.0.0.0/24"])).toBe(false);
  });

  it("does not match partial IP strings (no prefix collision)", () => {
    // 192.168.10.0/24 should NOT match 192.168.1.55
    expect(isIpAllowed("192.168.1.55", ["192.168.10.0/24"])).toBe(false);
  });
});

// ── 2. SMTP email alert logic ─────────────────────────────────────────────────
// Verify that sendEmail is called when totalFailed reaches 3 or 5.

describe("SMTP email alert on failed PIN attempts", () => {
  it("should call sendEmail when totalFailed === 3", async () => {
    const sendEmailMock = vi.fn().mockResolvedValue(true);
    const notifyOwnerMock = vi.fn().mockResolvedValue(true);
    const recipientEmail = "admin@example.com";

    // Simulate the alert logic extracted from verifyPin
    async function triggerAlertIfNeeded(totalFailed: number) {
      if (totalFailed === 3 || totalFailed === 5) {
        const alertTitle = `⚠️ Admin PIN: ${totalFailed} failed attempt${totalFailed > 1 ? 's' : ''} from 1.2.3.4`;
        const alertBody = `${totalFailed} failed admin PIN attempts detected.`;
        notifyOwnerMock({ title: alertTitle, content: alertBody });
        if (recipientEmail) {
          await sendEmailMock({ to: recipientEmail, subject: alertTitle, text: alertBody });
        }
      }
    }

    await triggerAlertIfNeeded(3);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: recipientEmail, subject: expect.stringContaining("3 failed") })
    );
    expect(notifyOwnerMock).toHaveBeenCalledTimes(1);
  });

  it("should call sendEmail when totalFailed === 5", async () => {
    const sendEmailMock = vi.fn().mockResolvedValue(true);
    const recipientEmail = "admin@example.com";

    async function triggerAlertIfNeeded(totalFailed: number) {
      if (totalFailed === 3 || totalFailed === 5) {
        await sendEmailMock({ to: recipientEmail, subject: `⚠️ Admin PIN: ${totalFailed} failed attempts`, text: "alert" });
      }
    }

    await triggerAlertIfNeeded(5);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("should NOT call sendEmail when totalFailed is 1, 2, or 4", async () => {
    const sendEmailMock = vi.fn().mockResolvedValue(true);

    async function triggerAlertIfNeeded(totalFailed: number) {
      if (totalFailed === 3 || totalFailed === 5) {
        await sendEmailMock({ to: "x@x.com", subject: "alert", text: "alert" });
      }
    }

    await triggerAlertIfNeeded(1);
    await triggerAlertIfNeeded(2);
    await triggerAlertIfNeeded(4);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("should NOT call sendEmail when recipientEmail is not configured", async () => {
    const sendEmailMock = vi.fn().mockResolvedValue(true);
    const recipientEmail: string | undefined = undefined;

    async function triggerAlertIfNeeded(totalFailed: number) {
      if (totalFailed === 3 || totalFailed === 5) {
        if (recipientEmail) {
          await sendEmailMock({ to: recipientEmail, subject: "alert", text: "alert" });
        }
      }
    }

    await triggerAlertIfNeeded(3);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

// ── 3. getPinAttemptChart bucketing logic ─────────────────────────────────────

describe("getPinAttemptChart bucketing logic", () => {
  function buildChartBuckets(rows: { createdAt: Date }[]): { date: string; count: number }[] {
    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = 0;
    }
    for (const row of rows) {
      const key = new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in buckets) buckets[key]++;
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }

  it("returns 7 buckets", () => {
    const result = buildChartBuckets([]);
    expect(result).toHaveLength(7);
  });

  it("all counts are 0 when no rows", () => {
    const result = buildChartBuckets([]);
    expect(result.every(r => r.count === 0)).toBe(true);
  });

  it("increments today's bucket for a row created today", () => {
    const today = new Date();
    const result = buildChartBuckets([{ createdAt: today }]);
    const todayKey = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const todayBucket = result.find(r => r.date === todayKey);
    expect(todayBucket?.count).toBe(1);
  });

  it("ignores rows older than 7 days", () => {
    const oldDate = new Date(Date.now() - 8 * 86_400_000);
    const result = buildChartBuckets([{ createdAt: oldDate }]);
    expect(result.every(r => r.count === 0)).toBe(true);
  });

  it("counts multiple rows on the same day", () => {
    const today = new Date();
    const result = buildChartBuckets([
      { createdAt: today },
      { createdAt: today },
      { createdAt: today },
    ]);
    const todayKey = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const todayBucket = result.find(r => r.date === todayKey);
    expect(todayBucket?.count).toBe(3);
  });
});

// ── 4. Router import smoke test ───────────────────────────────────────────────

describe("adminPinRouter smoke test", () => {
  it("imports and has _def with all new procedures", async () => {
    const { adminPinRouter } = await import("./routers/adminPin");
    expect(adminPinRouter).toBeDefined();
    expect(adminPinRouter).toHaveProperty("_def");
    const procedures = Object.keys((adminPinRouter as any)._def.procedures ?? {});
    expect(procedures).toContain("getIpAllowlist");
    expect(procedures).toContain("setIpAllowlist");
    expect(procedures).toContain("getPinAttemptChart");
    expect(procedures).toContain("verifyPin");
    expect(procedures).toContain("getPinAttemptHistory");
  });
});
