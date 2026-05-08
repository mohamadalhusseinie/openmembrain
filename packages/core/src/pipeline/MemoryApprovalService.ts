import { createId, nowIso } from "@openmembrain/shared";
import { Deduplicator } from "../deduplication/Deduplicator";
import { SecretDetector } from "../filtering/SecretDetector";
import { memoryEntryFromCandidate, type MemoryEntry } from "../types/MemoryEntry";
import type { AuditLogStore, MemoryStore, PendingCandidateStore } from "../types/Storage";

export interface MemoryApprovalServiceOptions {
  memoryStore: MemoryStore;
  pendingCandidateStore: PendingCandidateStore;
  auditLogStore: AuditLogStore;
  secretDetector?: SecretDetector;
  deduplicator?: Deduplicator;
}

export class MemoryApprovalService {
  private readonly memoryStore: MemoryStore;
  private readonly pendingCandidateStore: PendingCandidateStore;
  private readonly auditLogStore: AuditLogStore;
  private readonly secretDetector: SecretDetector;
  private readonly deduplicator: Deduplicator;

  constructor(options: MemoryApprovalServiceOptions) {
    this.memoryStore = options.memoryStore;
    this.pendingCandidateStore = options.pendingCandidateStore;
    this.auditLogStore = options.auditLogStore;
    this.secretDetector = options.secretDetector ?? new SecretDetector();
    this.deduplicator = options.deduplicator ?? new Deduplicator();
  }

  async approve(projectId: string, candidateId: string): Promise<MemoryEntry> {
    const candidate = await this.pendingCandidateStore.findById(projectId, candidateId);
    if (!candidate) {
      throw new Error(`Pending memory candidate ${candidateId} was not found.`);
    }

    if (candidate.sensitivity === "secret" || this.secretDetector.containsSecret(candidate.content)) {
      throw new Error("Secret candidates cannot be approved.");
    }

    const existing = await this.memoryStore.list(projectId);
    const duplicate = this.deduplicator.findDuplicate(candidate, existing);
    if (duplicate) {
      await this.pendingCandidateStore.remove(projectId, candidateId);
      return duplicate;
    }

    const approvedAt = nowIso();
    const memory = await this.memoryStore.save(memoryEntryFromCandidate(candidate, approvedAt));
    await this.pendingCandidateStore.remove(projectId, candidateId);
    await this.auditLogStore.append({
      id: createId("audit"),
      projectId,
      type: "memory_saved",
      entityId: memory.id,
      createdAt: approvedAt,
      details: {
        candidateId,
        approvedManually: true
      }
    });

    return memory;
  }

  async reject(projectId: string, candidateId: string, reason?: string): Promise<void> {
    const candidate = await this.pendingCandidateStore.findById(projectId, candidateId);
    if (!candidate) {
      throw new Error(`Pending memory candidate ${candidateId} was not found.`);
    }

    await this.pendingCandidateStore.remove(projectId, candidateId);
    await this.auditLogStore.append({
      id: createId("audit"),
      projectId,
      type: "candidate_rejected",
      entityId: candidateId,
      createdAt: nowIso(),
      details: {
        reason: reason ?? "Rejected by user."
      }
    });
  }
}
