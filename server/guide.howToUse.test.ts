/**
 * GuideHowToUse — server-side smoke test
 * Verifies that the guide tab is registered in the valid tabs list
 * and that the checkpoint notification script exists and is executable.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, accessSync, constants } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

describe("GuideHowToUse page", () => {
  it("GuideHowToUse component file exists", () => {
    const path = resolve(ROOT, "client/src/components/GuideHowToUse.tsx");
    expect(() => accessSync(path, constants.F_OK)).not.toThrow();
  });

  it("Home.tsx registers the guide tab in VALID_TABS", () => {
    const home = readFileSync(
      resolve(ROOT, "client/src/pages/Home.tsx"),
      "utf-8"
    );
    expect(home).toContain('"guide"');
  });

  it("Home.tsx imports GuideHowToUse", () => {
    const home = readFileSync(
      resolve(ROOT, "client/src/pages/Home.tsx"),
      "utf-8"
    );
    expect(home).toContain("import GuideHowToUse");
  });

  it("Home.tsx renders GuideHowToUse for the guide tab", () => {
    const home = readFileSync(
      resolve(ROOT, "client/src/pages/Home.tsx"),
      "utf-8"
    );
    expect(home).toContain('activeTab === "guide"');
    expect(home).toContain("<GuideHowToUse");
  });

  it("TopNav.tsx includes the guide tab entry", () => {
    const nav = readFileSync(
      resolve(ROOT, "client/src/components/TopNav.tsx"),
      "utf-8"
    );
    expect(nav).toContain('id: "guide"');
  });

  it("checkpoint notification script exists and is executable", () => {
    const script = resolve(ROOT, "scripts/notify-checkpoint.sh");
    expect(() => accessSync(script, constants.X_OK)).not.toThrow();
  });
});
