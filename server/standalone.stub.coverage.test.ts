/**
 * Standalone tRPC Stub Coverage Test
 *
 * Ensures every tRPC procedure called anywhere in the client source has a
 * corresponding stub in trpc.standalone.ts.  This prevents the
 * "Cannot read properties of undefined (reading 'useMutation')" crashes that
 * occur on the static GitHub Pages build when a new procedure is added to the
 * server router but its mock is forgotten.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Scans all *.ts / *.tsx files under client/src/ (excluding the mock itself
 *    and test files) for the pattern  trpc.<namespace>.<procedure>
 * 2. Parses trpc.standalone.ts to extract every  namespace: { procedure: … }
 *    entry that is present in the mock object.
 * 3. Asserts that every (namespace, procedure) pair found in step 1 exists in
 *    the set from step 2.
 *
 * WHEN A TEST FAILS
 * ──────────────────
 * Add the missing stub to client/src/lib/trpc.standalone.ts following the
 * existing patterns:
 *   - useQuery stubs  → return makeQuery(<sensible default>)
 *   - useMutation stubs → return makeMutation(() => <sensible default>)
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── paths ───────────────────────────────────────────────────────────────────
// This test lives in server/, so go up one level to reach the project root
const ROOT = path.resolve(__dirname, "../");
const CLIENT_SRC = path.join(ROOT, "client/src");
const STANDALONE_MOCK = path.join(CLIENT_SRC, "lib/trpc.standalone.ts");

// ─── helpers ─────────────────────────────────────────────────────────────────

const EXCLUDED_DIRS = new Set(["test", "tests", "__tests__", "node_modules"]);
const EXCLUDED_FILES = new Set(["trpc.standalone.ts", "trpc.standalone.tsx"]);

/** Recursively collect all .ts/.tsx source files, skipping test dirs/files */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        results.push(...collectSourceFiles(path.join(dir, entry.name)));
      }
    } else if (entry.isFile()) {
      const name = entry.name;
      if (
        !EXCLUDED_FILES.has(name) &&
        (name.endsWith(".ts") || name.endsWith(".tsx")) &&
        !name.endsWith(".test.ts") &&
        !name.endsWith(".test.tsx") &&
        !name.endsWith(".spec.ts") &&
        !name.endsWith(".spec.tsx")
      ) {
        results.push(path.join(dir, name));
      }
    }
  }
  return results;
}

/**
 * Extract all unique `trpc.<namespace>.<procedure>` pairs from source files.
 * Returns a Set of strings like "feedback.updateStatus".
 */
function extractClientProcedureCalls(files: string[]): Set<string> {
  const calls = new Set<string>();
  // Matches: trpc.someNamespace.someProcedure
  const RE = /trpc\.([a-z][a-zA-Z0-9]*)\.([a-zA-Z][a-zA-Z0-9]*)/g;
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    while ((m = RE.exec(src)) !== null) {
      const [, ns, proc] = m;
      // Skip meta-calls: trpc.useUtils(), trpc.Provider, trpc.createClient
      if (["useUtils", "Provider", "createClient"].includes(ns)) continue;
      calls.add(`${ns}.${proc}`);
    }
  }
  return calls;
}

/**
 * Parse the standalone mock file and return a Set of "namespace.procedure"
 * strings that are defined in it.
 *
 * Strategy: look for lines of the form
 *   ^  <namespace>: {          (2-space indent → namespace key)
 *   ^    <procedure>: {        (4-space indent → procedure key)
 * and track which namespace is currently open.
 */
function extractStubProcedures(mockFile: string): Set<string> {
  const stubs = new Set<string>();
  const src = fs.readFileSync(mockFile, "utf8");
  const lines = src.split("\n");

  const NS_RE = /^  ([a-z][a-zA-Z0-9]+): \{/;
  const PROC_RE = /^    ([a-z][a-zA-Z0-9]+): \{/;

  let currentNs: string | null = null;

  for (const line of lines) {
    const nsMatch = NS_RE.exec(line);
    if (nsMatch) {
      currentNs = nsMatch[1];
      continue;
    }
    const procMatch = PROC_RE.exec(line);
    if (procMatch && currentNs) {
      stubs.add(`${currentNs}.${procMatch[1]}`);
    }
  }
  return stubs;
}

// ─── helpers for useUtils coverage ─────────────────────────────────────────

/**
 * Extract all `utils.<namespace>.<key>` pairs from client source files.
 * These are the keys that must exist in the useUtils() return value of the mock.
 */
function extractClientUtilsCalls(files: string[]): Set<string> {
  const calls = new Set<string>();
  // Matches: utils.someNamespace.someKey (but not utils.someNamespace.someKey.method)
  const RE = /utils\.([a-z][a-zA-Z0-9]*)\.([ a-zA-Z][a-zA-Z0-9]*)/g;
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    while ((m = RE.exec(src)) !== null) {
      const [, ns, key] = m;
      // Skip meta-calls: utils.useUtils, utils.trpc, etc.
      if (["useUtils", "trpc", "Provider"].includes(ns)) continue;
      calls.add(`${ns}.${key.trim()}`);
    }
  }
  return calls;
}

/**
 * Parse the standalone mock file and return a Set of "namespace.key" strings
 * that are defined inside the useUtils() return object.
 *
 * Strategy: locate the useUtils: () => ({ ... }) block, then parse
 * the two-level object inside it.
 */
function extractUtilsStubKeys(mockFile: string): Set<string> {
  const stubs = new Set<string>();
  const src = fs.readFileSync(mockFile, "utf8");

  // Find the useUtils block
  const startIdx = src.indexOf("useUtils: () => ({");
  if (startIdx === -1) return stubs;

  // Find the matching closing })
  let depth = 0;
  let inBlock = false;
  let blockSrc = "";
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") {
      depth++;
      inBlock = true;
    }
    if (ch === "}") {
      depth--;
    }
    if (inBlock) blockSrc += ch;
    if (inBlock && depth === 0) break;
  }

  // Parse namespace and key lines from the block.
  // The block is extracted from the file starting at the opening { of useUtils: () => ({,
  // so indentation levels inside the block are relative to the file indent.
  // The useUtils object is at 2-space indent in the file:
  //   useUtils: () => ({          <- depth 1 (the outer ({
  //     disclaimer: { ... }       <- depth 2 namespace keys (4-space in file)
  //       status: { ... }         <- depth 3 sub-keys (6-space in file)
  // We track brace depth to identify namespace vs key lines.
  const lines = blockSrc.split("\n");
  let depth2 = 0;
  let currentNs: string | null = null;
  // Flexible: match any identifier followed by ': {' at any indent level,
  // and use brace depth to distinguish namespace (depth==2) from key (depth==3).
  const IDENT_RE = /^\s+([a-z][a-zA-Z0-9]+):\s*\{/;
  for (const line of lines) {
    // Count braces to track depth
    for (const ch of line) {
      if (ch === "{") depth2++;
      if (ch === "}") depth2--;
    }
    const m = IDENT_RE.exec(line);
    if (!m) continue;
    const ident = m[1];
    // After counting braces on this line, depth2 reflects state AFTER the line.
    // A namespace open brace takes us from depth 1 to 2 (or 2 to 3 for inline).
    // Use indent length as a proxy: namespace keys have 4-space indent, sub-keys 6-space.
    const indent = line.match(/^(\s+)/)?.[1].length ?? 0;
    if (indent === 4) {
      // namespace-level key
      currentNs = ident;
    } else if (indent === 6 && currentNs) {
      // sub-key inside a namespace
      stubs.add(`${currentNs}.${ident}`);
    } else if (indent === 4 && currentNs === null) {
      // flat key (namespace with inline value like disclaimer: { status: ... })
      currentNs = ident;
    }
  }
  // Also handle flat single-line entries like:
  //   disclaimer: { status: { invalidate: () => {} } },
  // by re-scanning with a different regex
  const FLAT_RE = /^    ([a-z][a-zA-Z0-9]+):\s*\{\s*([a-z][a-zA-Z0-9]+):/gm;
  let fm: RegExpExecArray | null;
  while ((fm = FLAT_RE.exec(blockSrc)) !== null) {
    stubs.add(`${fm[1]}.${fm[2]}`);
  }
  return stubs;
}

// ─── test ────────────────────────────────────────────────────────────────────

describe("trpc.standalone.ts stub coverage", () => {
  it("has a stub for every tRPC procedure called in the client source", () => {
    const sourceFiles = collectSourceFiles(CLIENT_SRC);
    const clientCalls = extractClientProcedureCalls(sourceFiles);
    const stubProcedures = extractStubProcedures(STANDALONE_MOCK);

    const missing: string[] = [...clientCalls]
      .filter(call => !stubProcedures.has(call))
      .sort();

    if (missing.length > 0) {
      const msg = [
        "",
        "The following tRPC procedures are used in the client but have NO stub",
        "in client/src/lib/trpc.standalone.ts.",
        "Add them to prevent TypeError crashes on the static build:",
        "",
        ...missing.map(p => `  ✗  ${p}`),
        "",
        "Pattern for a query stub:",
        "  <procedure>: {",
        "    useQuery: (_?: unknown, _opts?: unknown) => makeQuery(<default>),",
        "  },",
        "",
        "Pattern for a mutation stub:",
        "  <procedure>: {",
        "    useMutation: (_?: unknown) => makeMutation(() => ({ success: true })),",
        "  },",
      ].join("\n");
      expect.fail(msg);
    }

    expect(missing).toHaveLength(0);
    console.log(
      `✓ ${clientCalls.size} client procedure calls all covered by stubs in trpc.standalone.ts`
    );
  });
});

describe("trpc.standalone.ts useUtils() key coverage", () => {
  /**
   * Verifies that every `utils.<namespace>.<key>` pair accessed in the client
   * source has a corresponding entry in the useUtils() return object of
   * trpc.standalone.ts.
   *
   * A missing key causes a silent runtime failure: the invalidation call
   * becomes `undefined.invalidate()` and throws a TypeError at runtime.
   *
   * WHEN THIS TEST FAILS
   * ─────────────────────
   * Add the missing namespace/key to the useUtils() block in
   * client/src/lib/trpc.standalone.ts following the existing pattern:
   *
   *   <namespace>: {
   *     <key>: { invalidate: () => {} },
   *   },
   *
   * For optimistic-update keys also add cancel/getData/setData as needed.
   */
  it("has a useUtils stub for every utils.X.Y access in the client source", () => {
    const sourceFiles = collectSourceFiles(CLIENT_SRC);
    const clientUtilsCalls = extractClientUtilsCalls(sourceFiles);
    const utilsStubKeys = extractUtilsStubKeys(STANDALONE_MOCK);

    const missing: string[] = [...clientUtilsCalls]
      .filter(call => !utilsStubKeys.has(call))
      .sort();

    if (missing.length > 0) {
      const msg = [
        "",
        "The following utils.<namespace>.<key> pairs are used in the client but",
        "have NO entry in the useUtils() block of client/src/lib/trpc.standalone.ts.",
        "Add them to prevent silent TypeError crashes on the static build:",
        "",
        ...missing.map(p => `  ✗  ${p}`),
        "",
        "Pattern:",
        "  <namespace>: {",
        "    <key>: { invalidate: () => {} },",
        "  },",
        "",
        "For optimistic-update keys also add cancel/getData/setData as needed.",
      ].join("\n");
      expect.fail(msg);
    }

    expect(missing).toHaveLength(0);
    console.log(
      `✓ ${clientUtilsCalls.size} client utils.X.Y calls all covered by useUtils() stubs in trpc.standalone.ts`
    );
  });
});
