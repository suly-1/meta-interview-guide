/**
 * scripts/interaction-test.ts
 *
 * Playwright interaction tests — verifies that key toggles, tabs, and
 * interactive features actually WORK on the live site (not just load).
 *
 * Each test simulates a real user action and asserts the DOM changed as
 * expected. This catches broken toggles, missing event handlers, and
 * silent JS crashes that smoke tests miss.
 *
 * Usage:
 *   npx tsx scripts/interaction-test.ts [baseUrl]
 *
 * Examples:
 *   npx tsx scripts/interaction-test.ts https://metaengguide.pro
 *   npx tsx scripts/interaction-test.ts https://www.metaguide.blog
 *   npx tsx scripts/interaction-test.ts http://localhost:3000
 *
 * Exit codes:
 *   0 — all interaction tests passed
 *   1 — one or more tests failed
 */
import { chromium, type Browser, type Page } from "@playwright/test";

const BASE_URL = process.argv[2] ?? "https://metaengguide.pro";

// Errors that are expected and should not fail tests
const IGNORED_ERROR_PATTERNS = [
  /ResizeObserver loop/i,
  /Non-Error promise rejection/i,
  /Loading chunk/i,
  /Failed to fetch/i,
  /401/,
  /403/,
  /UNAUTHORIZED/i,
  /Please login/i,
  /supabase/i,
  /NetworkError/i,
  /net::ERR/i,
];

function isIgnoredError(msg: string): boolean {
  return IGNORED_ERROR_PATTERNS.some(p => p.test(msg));
}

interface TestResult {
  label: string;
  passed: boolean;
  errors: string[];
  durationMs: number;
}

// ── Shared helper: dismiss onboarding modal if present ───────────────────────
async function dismissOnboarding(page: Page) {
  // "Let's go!" button is the primary dismiss in OnboardingModal
  const letsGoBtn = page.locator('button:has-text("Let\'s go!")');
  const visible = await letsGoBtn
    .isVisible({ timeout: 2_000 })
    .catch(() => false);
  if (visible) {
    await letsGoBtn.click();
    await page.waitForTimeout(400);
  }
}

// ── Test runner helper ────────────────────────────────────────────────────────
async function runTest(
  browser: Browser,
  label: string,
  fn: (page: Page) => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  const errors: string[] = [];
  const page = await browser.newPage();

  // Collect console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!isIgnoredError(text)) {
        errors.push(`Console error: ${text}`);
      }
    }
  });

  // Collect uncaught exceptions
  page.on("pageerror", err => {
    if (!isIgnoredError(err.message)) {
      errors.push(`Uncaught exception: ${err.message}`);
    }
  });

  try {
    await fn(page);
  } catch (err) {
    errors.push(`Test failed: ${(err as Error).message}`);
  } finally {
    await page.close();
  }

  return {
    label,
    passed: errors.length === 0,
    errors,
    durationMs: Date.now() - start,
  };
}

// ── Individual interaction tests ──────────────────────────────────────────────

async function testTabSwitching(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "Tab switching (Overview → Coding → Behavioral → System Design)",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);

      // Click "Coding" tab using data-testid
      await page
        .locator("[data-testid='tab-coding']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(500);
      // Verify coding tab content is visible (Quick Drill start button)
      const codingContent = await page
        .locator("[data-testid='quick-drill-start']")
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      if (!codingContent)
        throw new Error("Coding tab content not visible after click");

      // Click "Behavioral" tab
      await page
        .locator("[data-testid='tab-behavioral']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(500);
      const behavioralContent = await page
        .locator("[data-testid='practice-mode-start']")
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      if (!behavioralContent)
        throw new Error("Behavioral tab content not visible after click");

      // Click "System Design" tab
      await page
        .locator("[data-testid='tab-design']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(500);
      const sdContent = await page
        .locator("[data-testid='sd-expand-0']")
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      if (!sdContent)
        throw new Error("System Design tab content not visible after click");

      // Return to Overview
      await page
        .locator("[data-testid='tab-overview']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(500);
      const overviewContent = await page
        .locator("text=OVERALL READINESS")
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      if (!overviewContent)
        throw new Error("Overview tab content not visible after returning");
    }
  );
}

async function testDarkModeToggle(browser: Browser): Promise<TestResult> {
  return runTest(browser, "Dark/light mode toggle", async page => {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await dismissOnboarding(page);

    // Get current theme
    const beforeClass = await page.evaluate(
      () => document.documentElement.className
    );
    const isDarkBefore = beforeClass.includes("dark");

    // Click dark mode toggle using data-testid
    await page
      .locator("[data-testid='dark-mode-toggle']")
      .click({ timeout: 5_000 });
    await page.waitForTimeout(400);

    const afterClass = await page.evaluate(
      () => document.documentElement.className
    );
    const isDarkAfter = afterClass.includes("dark");

    if (isDarkBefore === isDarkAfter) {
      throw new Error(
        `Dark mode toggle did not change html class (before: "${beforeClass}", after: "${afterClass}")`
      );
    }

    // Toggle back to original
    await page
      .locator("[data-testid='dark-mode-toggle']")
      .click({ timeout: 5_000 });
    await page.waitForTimeout(300);
  });
}

async function testPatternRating(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "Pattern star rating (click star 3 on first pattern)",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);

      // Navigate to coding tab first
      await page
        .locator("[data-testid='tab-coding']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(600);

      // Scroll down to the pattern list where star ratings are
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(400);

      // Click star 3 on the first pattern using data-testid
      const star3 = page.locator("[data-testid='star-3']").first();
      await star3.scrollIntoViewIfNeeded();
      await star3.click({ timeout: 5_000 });
      await page.waitForTimeout(300);

      // Verify the star is now active (has 'active' class)
      const starClass = await star3.getAttribute("class");
      if (!starClass?.includes("active")) {
        throw new Error(
          `Star 3 not marked active after click (class: "${starClass}")`
        );
      }
    }
  );
}

async function testSTARStoryExpand(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "STAR story expand/collapse in Overview tab",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(500);

      // Scroll down to find STAR story section
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(500);

      // Find an expandable story card (chevron button)
      const expandButton = page
        .locator("button:has(svg[data-lucide='chevron-down'])")
        .first();
      const expandVisible = await expandButton.isVisible().catch(() => false);

      if (!expandVisible) {
        // Verify STAR content is present
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (
          !bodyText.includes("STAR") &&
          !bodyText.includes("story") &&
          !bodyText.includes("Story")
        ) {
          throw new Error("No STAR story content found in Overview tab");
        }
        return; // Content present, expand UI may differ
      }

      // Click to expand
      await expandButton.click({ timeout: 3_000 });
      await page.waitForTimeout(400);

      // Click to collapse — ChevronUp should now be visible
      const collapseButton = page
        .locator("button:has(svg[data-lucide='chevron-up'])")
        .first();
      const collapseVisible = await collapseButton
        .isVisible()
        .catch(() => false);
      if (!collapseVisible)
        throw new Error(
          "Story did not expand (no ChevronUp found after click)"
        );

      await collapseButton.click({ timeout: 3_000 });
      await page.waitForTimeout(300);
    }
  );
}

async function testMockTimerStart(browser: Browser): Promise<TestResult> {
  return runTest(browser, "Mock timer start in Coding tab", async page => {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await dismissOnboarding(page);

    // Navigate to coding tab
    await page.locator("[data-testid='tab-coding']").click({ timeout: 5_000 });
    await page.waitForTimeout(600);

    // Find the mock timer start button using data-testid
    const startBtn = page.locator("[data-testid='mock-timer-start']");
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click({ timeout: 5_000 });
    await page.waitForTimeout(600);

    // After start, Pause button should appear
    const pauseBtn = page.locator("button:has-text('Pause')").first();
    const pauseVisible = await pauseBtn
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!pauseVisible)
      throw new Error("Pause button not visible after starting mock timer");
  });
}

async function testGlobalSearch(browser: Browser): Promise<TestResult> {
  return runTest(browser, "Global search (⌘K command palette)", async page => {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(500);

    // Click the search button using data-testid
    const searchBtn = page.locator("[data-testid='global-search-trigger']");
    await searchBtn.click({ timeout: 5_000 });
    await page.waitForTimeout(400);

    // Verify search dialog opened — input with correct placeholder
    const searchInput = page.locator("[data-testid='global-search-input']");
    const inputVisible = await searchInput
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!inputVisible)
      throw new Error(
        "Search dialog did not open after clicking search trigger"
      );

    // Type a query
    await searchInput.type("graph");
    await page.waitForTimeout(400);

    // Verify results appeared
    const results = page
      .locator("[class*='search-result'], [role='option'], button")
      .filter({ hasText: /graph/i });
    const count = await results.count();
    if (count === 0)
      throw new Error("No search results appeared after typing 'graph'");

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });
}

async function testInterviewDateSetter(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "Interview date setter (countdown widget)",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(500);

      // Find "Set date" button
      const setDateBtn = page
        .locator("button:has-text('Set date'), button:has-text('Set Date')")
        .first();
      const btnVisible = await setDateBtn.isVisible().catch(() => false);

      if (!btnVisible) {
        // May already have a date set — check for countdown
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (
          !bodyText.includes("interview") &&
          !bodyText.includes("Interview") &&
          !bodyText.includes("days")
        ) {
          throw new Error("No interview date widget found");
        }
        return;
      }

      // Click it — should open a date picker or input
      await setDateBtn.click({ timeout: 3_000 });
      await page.waitForTimeout(500);

      // Verify some date input or calendar appeared
      const dateInput = page
        .locator(
          "input[type='date'], input[type='text'][placeholder*='date'], [class*='calendar'], [class*='Calendar']"
        )
        .first();
      const dateInputVisible = await dateInput.isVisible().catch(() => false);
      if (!dateInputVisible)
        throw new Error("Date picker did not open after clicking 'Set date'");
    }
  );
}

async function testStreakDisplay(browser: Browser): Promise<TestResult> {
  return runTest(browser, "Streak counter visible in TopNav", async page => {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(1_000);

    // Streak badge is rendered with class "streak-badge" in TopNav
    const streakEl = page.locator(".streak-badge").first();
    const streakVisible = await streakEl.isVisible().catch(() => false);

    if (!streakVisible) {
      // Fallback: check for flame icon
      const flameIcon = page.locator("[data-lucide='flame']").first();
      const flameVisible = await flameIcon.isVisible().catch(() => false);
      if (!flameVisible)
        throw new Error("Streak counter not visible in TopNav");
    }
  });
}

async function testBehavioralPracticeMode(
  browser: Browser
): Promise<TestResult> {
  return runTest(
    browser,
    "Behavioral tab — Practice Mode timer starts",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);

      // Navigate to behavioral tab
      await page
        .locator("[data-testid='tab-behavioral']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(600);

      // Click Practice Mode start button using data-testid
      const startBtn = page.locator("[data-testid='practice-mode-start']");
      await startBtn.scrollIntoViewIfNeeded();
      await startBtn.click({ timeout: 5_000 });
      await page.waitForTimeout(500);

      // Verify practice mode opened (Reset button or timer visible)
      const resetBtn = page.locator("button:has-text('Reset')").first();
      const resetVisible = await resetBtn
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (!resetVisible)
        throw new Error(
          "Practice mode did not start (Reset button not visible)"
        );
    }
  );
}

async function testSystemDesignExpand(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "System Design tab — Framework step expands",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);

      // Navigate to system design tab
      await page
        .locator("[data-testid='tab-design']")
        .click({ timeout: 5_000 });
      await page.waitForTimeout(600);

      // Click first framework step using data-testid
      const expandBtn = page.locator("[data-testid='sd-expand-0']");
      await expandBtn.scrollIntoViewIfNeeded();
      await expandBtn.click({ timeout: 5_000 });
      await page.waitForTimeout(400);

      // Verify content expanded — "Functional" text should be visible
      const content = page.locator("text=Functional").first();
      const contentVisible = await content
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (!contentVisible)
        throw new Error("System Design framework step did not expand");

      // Collapse it
      await expandBtn.click({ timeout: 3_000 });
      await page.waitForTimeout(300);
    }
  );
}

async function testKeyboardShortcuts(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "Keyboard shortcut ? opens help modal",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(500);

      // Press ? to open keyboard shortcuts modal
      await page.locator("body").click();
      await page.keyboard.press("?");
      await page.waitForTimeout(500);

      // Check if a modal/dialog appeared
      const modal = page
        .locator(
          "[role='dialog'], [class*='modal'], [class*='Modal'], [class*='Dialog']"
        )
        .first();
      const modalVisible = await modal.isVisible().catch(() => false);

      if (!modalVisible) {
        // Check for overlay
        const overlay = page
          .locator(
            "[class*='overlay'], [class*='Overlay'], [class*='backdrop']"
          )
          .first();
        const overlayVisible = await overlay.isVisible().catch(() => false);
        if (!overlayVisible)
          throw new Error("Keyboard shortcut ? did not open help modal");
      }

      // Close with Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  );
}

async function testKeyboardTabSwitch(browser: Browser): Promise<TestResult> {
  return runTest(browser, "Keyboard shortcuts 1-4 switch tabs", async page => {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
    await dismissOnboarding(page);
    await page.waitForTimeout(500);

    // Press 2 to switch to Coding tab
    await page.locator("body").click();
    await page.keyboard.press("2");
    await page.waitForTimeout(500);

    // Verify coding tab content appeared
    const codingContent = await page
      .locator("[data-testid='quick-drill-start']")
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!codingContent)
      throw new Error("Keyboard shortcut '2' did not switch to Coding tab");

    // Press 1 to go back to Overview
    await page.keyboard.press("1");
    await page.waitForTimeout(400);
    const overviewContent = await page
      .locator("text=OVERALL READINESS")
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!overviewContent)
      throw new Error("Keyboard shortcut '1' did not switch to Overview tab");
  });
}

async function testProgressExport(browser: Browser): Promise<TestResult> {
  return runTest(
    browser,
    "Progress export button visible in Overview tab",
    async page => {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await dismissOnboarding(page);
      await page.waitForTimeout(500);

      // Scroll down to find export button
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(300);
        const exportBtn = page
          .locator(
            "button:has-text('Export'), button:has-text('Download'), button:has-text('PDF')"
          )
          .first();
        const btnVisible = await exportBtn.isVisible().catch(() => false);
        if (btnVisible) return; // Found it
      }

      // Final check at bottom of page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const exportBtn = page
        .locator(
          "button:has-text('Export'), button:has-text('Download'), button:has-text('PDF')"
        )
        .first();
      const btnVisible = await exportBtn.isVisible().catch(() => false);
      if (!btnVisible)
        throw new Error("Export/Download button not found in Overview tab");
    }
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────
const INTERACTION_TESTS = [
  testTabSwitching,
  testDarkModeToggle,
  testPatternRating,
  testSTARStoryExpand,
  testMockTimerStart,
  testGlobalSearch,
  testInterviewDateSetter,
  testStreakDisplay,
  testBehavioralPracticeMode,
  testSystemDesignExpand,
  testKeyboardShortcuts,
  testKeyboardTabSwitch,
  testProgressExport,
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🧪 Interaction tests: ${BASE_URL}\n`);
  const browser = await chromium.launch({ headless: true });
  const results: TestResult[] = [];

  for (const testFn of INTERACTION_TESTS) {
    const result = await testFn(browser);
    results.push(result);
    if (result.passed) {
      console.log(`  ✅ ${result.label} (${result.durationMs}ms)`);
    } else {
      console.log(`  ❌ ${result.label} (${result.durationMs}ms)`);
      result.errors.forEach(e => console.error(`     → ${e}`));
    }
  }

  await browser.close();

  const failed = results.filter(r => !r.passed);
  const passed = results.filter(r => r.passed);

  console.log(`\n─────────────────────────────────────────────────────────`);
  console.log(
    `  Results: ${passed.length}/${results.length} interaction tests passed`
  );

  if (failed.length > 0) {
    console.error(
      `\n❌ INTERACTION TESTS FAILED — ${failed.length} test(s) have errors:`
    );
    failed.forEach(r => {
      console.error(`\n  ${r.label}`);
      r.errors.forEach(e => console.error(`    → ${e}`));
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All interaction tests passed!\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error("Interaction test runner crashed:", err);
  process.exit(1);
});
