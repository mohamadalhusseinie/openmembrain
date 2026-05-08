import { normalizeMemoryContent } from "./Deduplicator";
import type { MemoryCandidate } from "../types/MemoryCandidate";
import type { MemoryEntry } from "../types/MemoryEntry";

export class ConflictDetector {
  findConflicts(candidate: MemoryCandidate, existing: MemoryEntry[]): MemoryEntry[] {
    const candidateTokens = importantTokens(candidate.content);
    const candidateNegated = hasNegation(candidate.content);

    return existing.filter((memory) => {
      if (memory.projectId !== candidate.projectId) {
        return false;
      }
      if (memory.scope !== candidate.scope && memory.scope !== "global" && candidate.scope !== "global") {
        return false;
      }

      const overlap = tokenOverlap(candidateTokens, importantTokens(memory.content));
      if (overlap < 0.45) {
        return false;
      }

      return candidateNegated !== hasNegation(memory.content);
    });
  }
}

function hasNegation(content: string): boolean {
  return /\b(do not|don't|never|forbidden|avoid|must not|disable)\b/i.test(content);
}

function importantTokens(content: string): Set<string> {
  const stopWords = new Set([
    "this",
    "that",
    "with",
    "from",
    "should",
    "must",
    "uses",
    "use",
    "using",
    "project",
    "rule",
    "the",
    "and",
    "for",
    "not"
  ]);

  return new Set(
    normalizeMemoryContent(content)
      .split(" ")
      .filter((token) => token.length > 3 && !stopWords.has(token))
  );
}

function tokenOverlap(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.min(left.size, right.size);
}
