import { normalizeMemoryContent } from "./Deduplicator";
import type { MemoryCandidate } from "../types/MemoryCandidate";
import type { MemoryEntry } from "../types/MemoryEntry";

export const conflictKinds = ["version_mismatch", "alternative", "negation"] as const;
export type ConflictKind = (typeof conflictKinds)[number];

export interface ConflictResult {
  memory: MemoryEntry;
  kind: ConflictKind;
}

export interface ConflictAnnotation {
  readonly memoryId: string;
  readonly kind: ConflictKind;
}

interface Comparable {
  readonly projectId: string;
  readonly scope: string;
  readonly content: string;
}

export class ConflictDetector {
  findConflicts(candidate: MemoryCandidate, existing: MemoryEntry[]): ConflictResult[] {
    const candidateTokens = importantTokens(candidate.content);
    const candidateNegated = hasNegation(candidate.content);
    const results: ConflictResult[] = [];

    for (const memory of existing) {
      const kind = detectConflictKind(candidate, candidateTokens, candidateNegated, memory);
      if (kind) {
        results.push({ memory, kind });
      }
    }

    return results;
  }

  /**
   * Detect conflicts among a set of memory entries (entry-vs-entry).
   * Returns a map from each entry id to the list of conflict annotations
   * with other entries. Only entries that have at least one conflict appear
   * in the returned map.
   */
  findConflictsAmong(entries: readonly MemoryEntry[]): Map<string, ConflictAnnotation[]> {
    const result = new Map<string, ConflictAnnotation[]>();

    for (let i = 0; i < entries.length; i++) {
      const left = entries[i]!;
      const leftTokens = importantTokens(left.content);
      const leftNegated = hasNegation(left.content);

      for (let j = i + 1; j < entries.length; j++) {
        const right = entries[j]!;
        const kind = detectConflictKind(left, leftTokens, leftNegated, right);
        if (kind) {
          let leftAnnotations = result.get(left.id);
          if (!leftAnnotations) {
            leftAnnotations = [];
            result.set(left.id, leftAnnotations);
          }
          leftAnnotations.push({ memoryId: right.id, kind });

          let rightAnnotations = result.get(right.id);
          if (!rightAnnotations) {
            rightAnnotations = [];
            result.set(right.id, rightAnnotations);
          }
          rightAnnotations.push({ memoryId: left.id, kind });
        }
      }
    }

    return result;
  }
}

/**
 * Shared comparison logic used by both findConflicts (candidate-vs-entry)
 * and findConflictsAmong (entry-vs-entry).
 */
function detectConflictKind(
  left: Comparable,
  leftTokens: Set<string>,
  leftNegated: boolean,
  right: Comparable,
): ConflictKind | undefined {
  if (right.projectId !== left.projectId) {
    return undefined;
  }
  if (right.scope !== left.scope && right.scope !== "global" && left.scope !== "global") {
    return undefined;
  }

  const rightTokens = importantTokens(right.content);
  const overlap = tokenOverlap(leftTokens, rightTokens);
  const rightNegated = hasNegation(right.content);

  if (
    overlap >= 0.45 &&
    leftNegated !== rightNegated &&
    !mentionsDifferentAlternatives(left.content, right.content)
  ) {
    return "negation";
  }

  return getAlternativeConflictKind(left.content, right.content, leftTokens, rightTokens);
}

const alternativeGroups: string[][][] = [
  [["angular"], ["react"], ["vue"], ["svelte"]],
  [["tabs"], ["spaces"]],
  [["docker", "container", "containers"], ["bare metal", "bare-metal"]],
  [["runtime environment"], ["compile time", "compile-time"]],
  [["npm"], ["pnpm"], ["yarn"], ["bun"]]
];

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

function getAlternativeConflictKind(
  candidateContent: string,
  memoryContent: string,
  candidateTokens: Set<string>,
  memoryTokens: Set<string>
): ConflictKind | undefined {
  if (hasNegation(candidateContent) || hasNegation(memoryContent)) {
    return undefined;
  }

  if (!hasSharedContext(candidateTokens, memoryTokens) && !hasMatchingDirective(candidateContent, memoryContent)) {
    return undefined;
  }

  if (hasDifferentNodeVersion(candidateContent, memoryContent)) {
    return "version_mismatch";
  }

  if (alternativeGroups.some((group) => hasDifferentAlternatives(candidateContent, memoryContent, group))) {
    return "alternative";
  }

  return undefined;
}

function hasSharedContext(left: Set<string>, right: Set<string>): boolean {
  return [...left].some((token) => right.has(token));
}

function hasMatchingDirective(left: string, right: string): boolean {
  return hasDirective(left) && hasDirective(right);
}

function hasDirective(content: string): boolean {
  return /\b(use|uses|target|deploy|prefer|preferred|always)\b/i.test(content);
}

function hasDifferentAlternatives(left: string, right: string, alternatives: string[][]): boolean {
  const leftAlternatives = foundAlternatives(left, alternatives);
  const rightAlternatives = foundAlternatives(right, alternatives);

  if (leftAlternatives.size === 0 || rightAlternatives.size === 0) {
    return false;
  }

  return ![...leftAlternatives].some((alternative) => rightAlternatives.has(alternative));
}

function mentionsDifferentAlternatives(left: string, right: string): boolean {
  return alternativeGroups.some((group) => {
    const leftAlternatives = foundMentionedAlternatives(left, group);
    const rightAlternatives = foundMentionedAlternatives(right, group);

    return (
      leftAlternatives.size > 0 &&
      rightAlternatives.size > 0 &&
      ![...leftAlternatives].some((alternative) => rightAlternatives.has(alternative))
    );
  });
}

function foundAlternatives(content: string, alternatives: string[][]): Set<number> {
  const found = new Set<number>();
  alternatives.forEach((terms, index) => {
    if (terms.some((term) => hasTerm(content, term) && !hasRejectedTerm(content, term))) {
      found.add(index);
    }
  });
  return found;
}

function foundMentionedAlternatives(content: string, alternatives: string[][]): Set<number> {
  const found = new Set<number>();
  alternatives.forEach((terms, index) => {
    if (terms.some((term) => hasTerm(content, term))) {
      found.add(index);
    }
  });
  return found;
}

function hasDifferentNodeVersion(left: string, right: string): boolean {
  const leftVersion = nodeVersion(left);
  const rightVersion = nodeVersion(right);
  return leftVersion !== undefined && rightVersion !== undefined && leftVersion !== rightVersion;
}

function nodeVersion(content: string): string | undefined {
  return normalizeTermText(content).match(/\bnode(?:\s+js)?\s+v?(\d+)\b/)?.[1];
}

function hasTerm(content: string, term: string): boolean {
  const normalizedTerm = escapeRegex(normalizeTermText(term));
  return new RegExp(`\\b${normalizedTerm.replace(/\\s+/g, "\\s+")}\\b`).test(normalizeTermText(content));
}

function hasRejectedTerm(content: string, term: string): boolean {
  const normalizedTerm = escapeRegex(normalizeTermText(term));
  const pattern = normalizedTerm.replace(/\\s+/g, "\\s+");
  return new RegExp(`\\b(instead of|rather than|not)\\s+${pattern}\\b`).test(normalizeTermText(content));
}

function normalizeTermText(content: string): string {
  return normalizeMemoryContent(content).replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenOverlap(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.min(left.size, right.size);
}
