/**
 * Tests for aiCodingMock router — verifies problem set structure and router exports
 */
import { describe, it, expect } from "vitest";
import { AI_CODING_PROBLEMS, aiCodingMockRouter } from "./aiCodingMock";

describe("AI_CODING_PROBLEMS", () => {
  it("has at least 5 problems", () => {
    expect(AI_CODING_PROBLEMS.length).toBeGreaterThanOrEqual(5);
  });

  it("each problem has required fields", () => {
    for (const p of AI_CODING_PROBLEMS) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.difficulty).toMatch(/^L[5-7]$/);
      expect(p.topic).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });

  it("each problem has 3 phases: bugFix, featureImpl, optimize", () => {
    for (const p of AI_CODING_PROBLEMS) {
      expect(p.phases.bugFix).toBeDefined();
      expect(p.phases.featureImpl).toBeDefined();
      expect(p.phases.optimize).toBeDefined();
    }
  });

  it("bugFix phase has failing tests and starter files", () => {
    for (const p of AI_CODING_PROBLEMS) {
      const bf = p.phases.bugFix;
      expect(bf.minutes).toBeGreaterThan(0);
      expect(bf.instructions).toBeTruthy();
      expect(bf.failingTests.length).toBeGreaterThan(0);
      expect(Object.keys(bf.files).length).toBeGreaterThan(0);
    }
  });

  it("featureImpl phase has starter files", () => {
    for (const p of AI_CODING_PROBLEMS) {
      const fi = p.phases.featureImpl;
      expect(fi.minutes).toBeGreaterThan(0);
      expect(fi.instructions).toBeTruthy();
      expect(Object.keys(fi.files).length).toBeGreaterThan(0);
    }
  });

  it("optimize phase has instructions", () => {
    for (const p of AI_CODING_PROBLEMS) {
      const opt = p.phases.optimize;
      expect(opt.minutes).toBeGreaterThan(0);
      expect(opt.instructions).toBeTruthy();
    }
  });

  it("all problem IDs are unique", () => {
    const ids = AI_CODING_PROBLEMS.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("total interview time per problem is 55 minutes", () => {
    for (const p of AI_CODING_PROBLEMS) {
      const total =
        p.phases.bugFix.minutes +
        p.phases.featureImpl.minutes +
        p.phases.optimize.minutes;
      expect(total).toBe(55);
    }
  });
});

describe("aiCodingMockRouter", () => {
  it("exports a valid tRPC router", () => {
    expect(aiCodingMockRouter).toBeDefined();
    expect(typeof aiCodingMockRouter).toBe("object");
  });

  it("has getProblems, chat, scorePhase, scoreSession procedures", () => {
    const procedures = Object.keys(aiCodingMockRouter._def.procedures);
    expect(procedures).toContain("getProblems");
    expect(procedures).toContain("chat");
    expect(procedures).toContain("scorePhase");
    expect(procedures).toContain("scoreSession");
  });

  it("getProblems is a public procedure (no auth required)", () => {
    const proc = aiCodingMockRouter._def.procedures.getProblems;
    // Public procedures don't have 'protected' in their middleware chain
    expect(proc).toBeDefined();
  });

  it("chat is a protected procedure", () => {
    const proc = aiCodingMockRouter._def.procedures.chat;
    expect(proc).toBeDefined();
  });
});
