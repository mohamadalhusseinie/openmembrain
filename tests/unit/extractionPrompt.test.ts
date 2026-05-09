import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildUserPrompt,
} from "../../packages/core/src/extraction/extractionPrompt";
import {
  memoryTypes,
  recommendedActions,
} from "../../packages/core/src/types/MemoryCandidate";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("mentions durable project knowledge", () => {
    expect(prompt).toContain("durable project knowledge");
  });

  it("mentions JSON", () => {
    expect(prompt).toContain("JSON");
  });

  it("includes all memory type values", () => {
    for (const t of memoryTypes) {
      expect(prompt).toContain(t);
    }
  });

  it("includes all recommended action values", () => {
    for (const a of recommendedActions) {
      expect(prompt).toContain(a);
    }
  });

  it("mentions good memory criteria", () => {
    expect(prompt).toContain("good memory");
  });

  it("mentions bad memory criteria", () => {
    expect(prompt).toContain("bad memory");
  });
});

describe("buildUserPrompt", () => {
  it("includes the session text", () => {
    expect(buildUserPrompt("some session text")).toContain("some session text");
  });

  it("works with empty string", () => {
    const result = buildUserPrompt("");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});
