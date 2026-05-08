import { join } from "node:path";
import type { MemoryCandidate, PendingCandidateStore } from "@openmembrain/core";
import { readJsonArray, writeJsonArray } from "./jsonFile";

export class JsonPendingCandidateStore implements PendingCandidateStore {
  private readonly filePath: string;

  constructor(baseDir: string) {
    this.filePath = join(baseDir, "pending-candidates.json");
  }

  async list(projectId: string): Promise<MemoryCandidate[]> {
    const rows = await readJsonArray<MemoryCandidate>(this.filePath);
    return rows.filter((candidate) => candidate.projectId === projectId);
  }

  async findById(projectId: string, candidateId: string): Promise<MemoryCandidate | undefined> {
    return (await this.list(projectId)).find((candidate) => candidate.id === candidateId);
  }

  async save(candidate: MemoryCandidate): Promise<MemoryCandidate> {
    const rows = await readJsonArray<MemoryCandidate>(this.filePath);
    const index = rows.findIndex((row) => row.id === candidate.id);
    if (index >= 0) {
      rows[index] = candidate;
    } else {
      rows.push(candidate);
    }
    await writeJsonArray(this.filePath, rows);
    return candidate;
  }

  async remove(projectId: string, candidateId: string): Promise<void> {
    const rows = await readJsonArray<MemoryCandidate>(this.filePath);
    await writeJsonArray(
      this.filePath,
      rows.filter((candidate) => candidate.projectId !== projectId || candidate.id !== candidateId)
    );
  }
}
