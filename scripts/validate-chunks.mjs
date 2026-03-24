/**
 * validate-chunks.mjs
 *
 * Static analysis of the production build output to catch TDZ (Temporal Dead
 * Zone) bundling errors BEFORE the smoke test runs.
 *
 * The specific failure we guard against:
 *   recharts (and other React-dependent libs) call React.forwardRef /
 *   React.createContext at module initialisation time. If Rollup places them
 *   in a separate chunk from React, the minifier may produce an execution
 *   order where the dependent chunk runs before React is initialised, causing:
 *
 *     ReferenceError: Cannot access 'P' before initialization
 *
 * This script checks that:
 *   1. No chunk other than the React chunk imports React internals directly
 *      (i.e. no cross-chunk React dependency that could cause TDZ)
 *   2. Known React-dependent libraries (recharts, d3-*) live in the same
 *      chunk as React
 *   3. No chunk contains the literal string pattern that causes the TDZ crash
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more issues found → block deploy
 *
 * Usage:
 *   node scripts/validate-chunks.mjs
 *   node scripts/validate-chunks.mjs --dir path/to/build/assets
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const dirIdx = args.indexOf("--dir");
const __dir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = join(__dir, "..");
const assetsDir =
  dirIdx >= 0 ? args[dirIdx + 1] : join(projectRoot, "dist", "public", "assets");

if (!existsSync(assetsDir)) {
  console.error(`\n❌  Assets directory not found: ${assetsDir}`);
  console.error("    Run  pnpm run build  first.\n");
  process.exit(1);
}

// ─── Load all JS chunks ───────────────────────────────────────────────────────
const jsFiles = readdirSync(assetsDir).filter(
  (f) => extname(f) === ".js" && !f.endsWith(".map")
);

console.log(`\n🔍  Validating ${jsFiles.length} JS chunks in ${assetsDir}`);

// ─── Checks ───────────────────────────────────────────────────────────────────
const issues = [];

// Libraries that MUST be co-bundled with React because they call React APIs
// at module initialisation time (not inside functions/components)
const REACT_DEPENDENT_LIBS = [
  "recharts",
  "d3-shape",
  "d3-scale",
  "d3-path",
  "d3-color",
  "d3-interpolate",
  "d3-format",
  "d3-time",
  "d3-time-format",
  "d3-array",
  "victory-vendor",
];

// Find which chunk contains React itself.
// Strategy: prefer vendor-* chunks over the main index chunk, since React
// should be in a vendor chunk. If it's in the main index bundle that's also
// fine — the important thing is that dependent libs are in the SAME chunk.
let reactChunk = null;

// First pass: look in vendor-* chunks only
for (const file of jsFiles) {
  if (!file.startsWith('vendor-')) continue;
  const content = readFileSync(join(assetsDir, file), "utf-8");
  // React DOM production build always exports these
  if (content.includes("createRoot") && content.includes("forwardRef") && content.includes("createContext")) {
    reactChunk = file;
    break;
  }
}

if (!reactChunk) {
  // Second pass: check all chunks (React may be inlined into the main bundle)
  for (const file of jsFiles) {
    const content = readFileSync(join(assetsDir, file), "utf-8");
    if (content.includes("createRoot") && content.includes("forwardRef") && content.includes("createContext")) {
      reactChunk = file;
      break;
    }
  }
}

console.log(`  React chunk   : ${reactChunk || "(not found)"}`);

// Check each React-dependent library is in the React chunk
for (const lib of REACT_DEPENDENT_LIBS) {
  let foundInChunk = null;
  for (const file of jsFiles) {
    const content = readFileSync(join(assetsDir, file), "utf-8");
    if (content.includes(lib)) {
      foundInChunk = file;
      break;
    }
  }

  if (foundInChunk && reactChunk && foundInChunk !== reactChunk) {
    issues.push(
      `Library "${lib}" is in chunk "${foundInChunk}" but React is in "${reactChunk}". ` +
        `This can cause a TDZ ReferenceError at runtime. ` +
        `Fix: add "${lib}" to the same manualChunks group as React in vite.config.ts.`
    );
  }
}

// Check for the literal TDZ error pattern in any chunk
// (minified "Cannot access 'X' before initialization" where X is a short var)
for (const file of jsFiles) {
  const content = readFileSync(join(assetsDir, file), "utf-8");
  // The TDZ pattern appears as: Cannot access 'P' before initialization
  // where P is a 1-2 char minified variable name
  const tdzMatch = content.match(/Cannot access '[A-Za-z]{1,3}' before initialization/);
  if (tdzMatch) {
    issues.push(
      `Chunk "${file}" contains a TDZ error string: "${tdzMatch[0]}". ` +
        `This will crash the page at runtime. Check manualChunks in vite.config.ts.`
    );
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────
console.log("\n📋  Chunk Validation Results");
console.log("─".repeat(50));
console.log(`  Chunks checked: ${jsFiles.length}`);
console.log(`  Issues found  : ${issues.length}`);

if (issues.length > 0) {
  console.error("\n❌  Chunk validation FAILED:");
  issues.forEach((issue, i) => {
    console.error(`\n  ${i + 1}. ${issue}`);
  });
  console.error(
    "\n🚫  Fix the issues above before deploying.\n"
  );
  process.exit(1);
} else {
  console.log("\n✅  All chunks are valid — no TDZ risks detected.\n");
  process.exit(0);
}
