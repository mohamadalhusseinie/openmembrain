import { join } from "node:path";
import type { MemoryEntry, MemorySearchOptions, MemoryStore } from "@openmembrain/core";
import { readJsonArray, writeJsonArray } from "./jsonFile";

export class JsonMemoryStore implements MemoryStore {
  private readonly filePath: string;

  constructor(baseDir: string) {
    this.filePath = join(baseDir, "memories.json");
  }

  async list(projectId: string): Promise<MemoryEntry[]> {
    const rows = await readJsonArray<MemoryEntry>(this.filePath);
    return rows.filter((memory) => memory.projectId === projectId && memory.status === "active");
  }

  async findById(projectId: string, memoryId: string): Promise<MemoryEntry | undefined> {
    return (await this.list(projectId)).find((memory) => memory.id === memoryId);
  }

  async save(entry: MemoryEntry): Promise<MemoryEntry> {
    const rows = await readJsonArray<MemoryEntry>(this.filePath);
    const index = rows.findIndex((memory) => memory.id === entry.id);
    if (index >= 0) {
      rows[index] = entry;
    } else {
      rows.push(entry);
    }
    await writeJsonArray(this.filePath, rows);
    return entry;
  }

  async search(projectId: string, query: string, options: MemorySearchOptions = {}): Promise<MemoryEntry[]> {
    const queryTokens = tokenize(query);
    const rows = await this.list(projectId);
    const filtered = rows.filter((memory) => {
      if (options.scopes && !options.scopes.includes(memory.scope)) {
        return false;
      }
      if (options.types && !options.types.includes(memory.type)) {
        return false;
      }
      if (options.tags && !options.tags.some((tag) => memory.tags.includes(tag))) {
        return false;
      }
      if (queryTokens.length === 0) {
        return true;
      }

      const haystack = tokenize([memory.content, memory.type, memory.scope, ...memory.tags].join(" "));
      return queryTokens.some((token) => haystack.includes(token));
    });

    return filtered
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, options.limit ?? 20);
  }
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
