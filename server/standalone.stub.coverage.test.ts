/**
 * standalone.stub.coverage.test.ts
 *
 * Regression guard: ensures every `trpc.<namespace>.<method>.(useMutation|useQuery)`
 * call found in the client source has a matching stub in trpc.standalone.ts.
 *
 * WHY THIS EXISTS
 * ---------------
 * The static build (metaengguide.pro) uses trpc.standalone.ts instead of the real
 * tRPC client. If a new procedure is added to a component but its stub is forgotten,
 * the page crashes at runtime with:
 *   TypeError: $t.<namespace>.<method>.(useMutation|useQuery) is not a function
 *
 * This test catches that at CI time, before it ever reaches users.
 *
 * HOW IT WORKS
 * ------------
 * 1. Recursively scans client/src/**\/*.{ts,tsx} for all patterns matching
 *    `trpc.<namespace>.<method>.(useMutation|useQuery)`.
 * 2. Parses trpc.standalone.ts to extract all (namespace, method, hook) triples
 *    that are actually defined.
 * 3. Asserts that every call found in step 1 is covered by step 2.
 *
 * WHEN YOU ADD A NEW PROCEDURE
 * ----------------------------
 * 1. Add the procedure to server/routers/<feature>.ts
 * 2. Add the stub to client/src/lib/trpc.standalone.ts
 * 3. Run `pnpm test` — this test will fail if you forgot step 2.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");
const CLIENT_SRC = path.join(ROOT, "client", "src");
const STANDALONE_FILE = path.join(CLIENT_SRC, "lib", "trpc.standalone.ts");

/** Recursively collect all .ts / .tsx files under a directory, excluding the standalone file itself */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      fullPath !== STANDALONE_FILE
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extract all (namespace, method, hook) triples from source files.
 * Matches patterns like:
 *   trpc.feedback.submitSiteFeedback.useMutation()
 *   trpc.auth.me.useQuery(...)
 */
function extractSourceCalls(files: string[]): Set<string> {
  const calls = new Set<string>();
  const pattern = /trpc\.([a-zA-Z]+)\.([a-zA-Z0-9]+)\.(useMutation|useQuery)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const [, ns, method, hook] = match;
      calls.add(`${ns}.${method}.${hook}`);
    }
  }
  return calls;
}

/**
 * Extract all (namespace, method, hook) triples that are *defined* in trpc.standalone.ts.
 * Looks for patterns like:
 *   useMutation: () =>
 *   useQuery: (_?: unknown
 * within the context of a method block.
 *
 * Strategy: scan for `<method>: {` then look for useMutation/useQuery within the
 * next 600 chars (the method block). Track the current namespace by finding the
 * nearest preceding `<namespace>: {` at depth 0.
 */
function extractStandaloneStubs(standaloneContent: string): Set<string> {
  const stubs = new Set<string>();

  // Find all namespace blocks: top-level keys of the `trpc` object
  // We identify them by looking for patterns like `  <word>: {` (2-space indent = top-level)
  const nsPattern = /^  ([a-zA-Z]+)\s*:\s*\{/gm;
  const nsMatches: Array<{ ns: string; start: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = nsPattern.exec(standaloneContent)) !== null) {
    nsMatches.push({ ns: m[1], start: m.index });
  }

  // For each namespace, find all method blocks within it and check for hooks
  for (let i = 0; i < nsMatches.length; i++) {
    const { ns, start } = nsMatches[i];
    const end = i + 1 < nsMatches.length ? nsMatches[i + 1].start : standaloneContent.length;
    const nsBlock = standaloneContent.slice(start, end);

    // Find method blocks: `    <method>: {` (4-space indent = method level)
    const methodPattern = /^    ([a-zA-Z0-9]+)\s*:\s*\{/gm;
    let mm: RegExpExecArray | null;
    while ((mm = methodPattern.exec(nsBlock)) !== null) {
      const method = mm[1];
      // Skip reserved words that aren't procedures
      if (["useUtils", "Provider", "createClient"].includes(method)) continue;

      // Look at the method block (next 800 chars) for hook definitions
      const methodBlockStart = mm.index + mm[0].length;
      const methodBlock = nsBlock.slice(methodBlockStart, methodBlockStart + 800);

      if (/\buseMutation\s*:/.test(methodBlock)) {
        stubs.add(`${ns}.${method}.useMutation`);
      }
      if (/\buseQuery\s*:/.test(methodBlock)) {
        stubs.add(`${ns}.${method}.useQuery`);
      }
    }

    // Also handle direct `useMutation` at namespace level (e.g. metaScreenDebrief)
    if (/^\s+useMutation\s*:/m.test(nsBlock)) {
      stubs.add(`${ns}.useMutation`);
    }
  }

  return stubs;
}

// ── Test ─────────────────────────────────────────────────────────────────────

describe("trpc.standalone.ts stub coverage", () => {
  it("has a stub for every trpc call used in client source files", () => {
    // 1. Collect all source files
    const sourceFiles = collectSourceFiles(CLIENT_SRC);
    expect(sourceFiles.length).toBeGreaterThan(0);

    // 2. Extract all calls from source
    const sourceCalls = extractSourceCalls(sourceFiles);
    expect(sourceCalls.size).toBeGreaterThan(0);

    // 3. Extract all stubs from standalone
    const standaloneContent = fs.readFileSync(STANDALONE_FILE, "utf-8");
    const standaloneStubs = extractStandaloneStubs(standaloneContent);
    expect(standaloneStubs.size).toBeGreaterThan(0);

    // 4. Find missing stubs
    const missing: string[] = [];
    for (const call of sourceCalls) {
      if (!standaloneStubs.has(call)) {
        missing.push(call);
      }
    }

    // 5. Assert — provide a clear error message listing every missing stub
    if (missing.length > 0) {
      const instructions = missing
        .sort()
        .map((call) => {
          const [ns, method, hook] = call.split(".");
          if (hook === "useMutation") {
            return `  ${method}: { useMutation: () => makeMutation(() => ({ success: true })) },`;
          } else {
            return `  ${method}: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery(null) },`;
          }
        })
        .join("\n");

      throw new Error(
        `\n\n🚨 STANDALONE STUB COVERAGE FAILURE\n` +
          `The following trpc calls are used in client source but have no stub in trpc.standalone.ts:\n\n` +
          missing.sort().map((c) => `  ✗ trpc.${c}`).join("\n") +
          `\n\nAdd these stubs to client/src/lib/trpc.standalone.ts:\n\n` +
          instructions +
          `\n\nSee the comment at the top of standalone.stub.coverage.test.ts for full instructions.\n`
      );
    }

    // Log coverage summary for visibility
    console.log(
      `✅ Standalone stub coverage: ${sourceCalls.size} calls checked, all covered by ${standaloneStubs.size} stubs.`
    );
  });

  it("standalone file exports a trpc object with useUtils function", () => {
    const standaloneContent = fs.readFileSync(STANDALONE_FILE, "utf-8");
    expect(standaloneContent).toContain("export const trpc");
    expect(standaloneContent).toContain("useUtils");
    expect(standaloneContent).toContain("Provider");
    expect(standaloneContent).toContain("createClient");
  });

  it("all stubs use the correct makeMutation / makeQuery helpers", () => {
    const standaloneContent = fs.readFileSync(STANDALONE_FILE, "utf-8");
    // Every useMutation should use makeMutation
    const mutationStubs = (standaloneContent.match(/useMutation\s*:\s*\(\)/g) || []).length;
    const makeMutationCalls = (standaloneContent.match(/makeMutation\s*\(/g) || []).length;
    expect(makeMutationCalls).toBeGreaterThanOrEqual(mutationStubs);

    // Every useQuery should use makeQuery
    const queryStubs = (standaloneContent.match(/useQuery\s*:/g) || []).length;
    const makeQueryCalls = (standaloneContent.match(/makeQuery\s*\(/g) || []).length;
    expect(makeQueryCalls).toBeGreaterThanOrEqual(queryStubs);
  });
});
