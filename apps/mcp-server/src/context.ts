import { basename, join, resolve } from "node:path";
import { cwd, env } from "node:process";
import { MemoryApprovalService, MemoryPipeline, MockMemoryExtractor } from "@openmembrain/core";
import { JsonAuditLogStore, JsonMemoryStore, JsonPendingCandidateStore } from "@openmembrain/storage";

export interface OpenMembrainMcpContext {
  defaultProjectId: string;
  storageDir: string;
  memoryStore: JsonMemoryStore;
  pendingCandidateStore: JsonPendingCandidateStore;
  auditLogStore: JsonAuditLogStore;
  pipeline: MemoryPipeline;
  approvalService: MemoryApprovalService;
}

export function createOpenMembrainContext(
  options: Partial<Pick<OpenMembrainMcpContext, "defaultProjectId" | "storageDir">> = {}
): OpenMembrainMcpContext {
  const workingDirectory = cwd();
  const storageDir = resolve(options.storageDir ?? env.OPENMEMBRAIN_HOME ?? join(workingDirectory, ".openmembrain"));
  const defaultProjectId = options.defaultProjectId ?? env.OPENMEMBRAIN_PROJECT_ID ?? basename(workingDirectory);

  const memoryStore = new JsonMemoryStore(storageDir);
  const pendingCandidateStore = new JsonPendingCandidateStore(storageDir);
  const auditLogStore = new JsonAuditLogStore(storageDir);
  const pipeline = new MemoryPipeline({
    extractor: new MockMemoryExtractor(),
    memoryStore,
    pendingCandidateStore,
    auditLogStore
  });
  const approvalService = new MemoryApprovalService({
    memoryStore,
    pendingCandidateStore,
    auditLogStore
  });

  return {
    defaultProjectId,
    storageDir,
    memoryStore,
    pendingCandidateStore,
    auditLogStore,
    pipeline,
    approvalService
  };
}

export function resolveProjectId(context: Pick<OpenMembrainMcpContext, "defaultProjectId">, projectId?: string): string {
  const normalized = projectId?.trim();
  return normalized || context.defaultProjectId;
}
