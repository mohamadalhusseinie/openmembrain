import { describe, it, expect } from "vitest";
import { chunkTranscript } from "@openmembrain/core";

describe("chunkTranscript", () => {
  it("returns empty array for empty string", () => {
    expect(chunkTranscript("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(chunkTranscript("   \n\n  \t  ")).toEqual([]);
  });

  it("returns single chunk for short text", () => {
    const text = "Hello world";
    expect(chunkTranscript(text)).toEqual([text]);
  });

  it("splits long text at paragraph boundaries", () => {
    const para1 = "A".repeat(30);
    const para2 = "B".repeat(30);
    const para3 = "C".repeat(30);
    const text = [para1, para2, para3].join("\n\n");
    const chunks = chunkTranscript(text, 70);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(70);
    }
  });

  it("splits very long single paragraph at line boundaries", () => {
    const lines = Array.from({ length: 20 }, (_, i) => "Line" + i + " ".repeat(10));
    const text = lines.join("\n");
    const chunks = chunkTranscript(text, 50);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(50);
    }
  });

  it("respects custom maxChunkCharacters parameter", () => {
    const text = "A".repeat(100);
    const chunks = chunkTranscript(text, 200);
    expect(chunks).toEqual([text]);
  });

  it("each chunk is under the max size", () => {
    const paragraphs = Array.from({ length: 50 }, (_, i) => `Paragraph ${i}: ${"x".repeat(80)}`);
    const text = paragraphs.join("\n\n");
    const maxSize = 300;
    const chunks = chunkTranscript(text, maxSize);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(maxSize);
    }
  });

  it("preserves all content (no data loss)", () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) => `Para ${i}: ${"w".repeat(40)}`);
    const text = paragraphs.join("\n\n");
    const chunks = chunkTranscript(text, 100);
    // All original paragraphs should appear in the joined chunks
    for (const para of paragraphs) {
      const found = chunks.some((c) => c.includes(para));
      expect(found).toBe(true);
    }
  });
});
