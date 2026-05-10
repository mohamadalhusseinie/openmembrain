import { readFile, rename, stat } from "node:fs/promises";
import type { HasTypeAndScope } from "./directoryStore";
import { writeEntry, rebuildAllIndexes } from "./directoryStore";

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function migrateMemories(legacyPath: string, targetDir: string): Promise<void> {
  await migrateFlat(legacyPath, targetDir);
}

export async function migratePending(legacyPath: string, targetDir: string): Promise<void> {
  await migrateFlat(legacyPath, targetDir);
}

async function migrateFlat(legacyPath: string, targetDir: string): Promise<void> {
  const backupPath = `${legacyPath}.backup`;
  if (await fileExists(backupPath)) return;
  if (!(await fileExists(legacyPath))) return;

  const raw = await readFile(legacyPath, "utf8");
  let entries: HasTypeAndScope[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    entries = parsed as HasTypeAndScope[];
  } catch {
    return;
  }

  for (const entry of entries) {
    await writeEntry(targetDir, entry);
  }

  await rebuildAllIndexes(targetDir);
  await rename(legacyPath, backupPath);
}
