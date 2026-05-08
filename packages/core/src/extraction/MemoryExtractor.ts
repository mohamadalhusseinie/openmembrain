import type { MemoryCandidate } from "../types/MemoryCandidate";
import type { SessionInput } from "../types/SessionInput";

export interface MemoryExtractor {
  extract(input: SessionInput): Promise<MemoryCandidate[]>;
}
