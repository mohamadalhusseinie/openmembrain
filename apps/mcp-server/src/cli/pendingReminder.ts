import type { PendingCandidateStore } from "@openmembrain/core";

export async function printPendingReminder(
  store: PendingCandidateStore,
  projectId: string
): Promise<void> {
  const pending = await store.list(projectId);
  if (pending.length > 0) {
    const noun = pending.length === 1 ? "candidate is" : "candidates are";
    process.stderr.write(
      `\nNote: ${pending.length} memory ${noun} waiting for review.\n`
    );
  }
}
