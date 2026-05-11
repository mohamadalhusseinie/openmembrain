import { join } from "node:path";
import type { AuditLogStore, DiagnosticsLogStore, MemoryStore, PendingCandidateStore } from "@openmembrain/core";
import { JsonMemoryStore } from "./MemoryStore";
import { JsonPendingCandidateStore } from "./PendingCandidateStore";
import { JsonAuditLogStore } from "./AuditLogStore";
import { JsonDiagnosticsLogStore } from "./DiagnosticsLogStore";
import { openDatabase } from "./sqlite/db";
import { SqliteMemoryStore } from "./sqlite/SqliteMemoryStore";
import { SqlitePendingCandidateStore } from "./sqlite/SqlitePendingCandidateStore";
import { SqliteAuditLogStore } from "./sqlite/SqliteAuditLogStore";
import { SqliteDiagnosticsLogStore } from "./sqlite/SqliteDiagnosticsLogStore";

export type StorageBackend = "json" | "sqlite";

export interface StorageBackendConfig {
  backend: StorageBackend;
  baseDir: string;
}

export interface StoreSet {
  memoryStore: MemoryStore;
  pendingCandidateStore: PendingCandidateStore;
  auditLogStore: AuditLogStore;
  diagnosticsLogStore: DiagnosticsLogStore;
  close?: () => void;
}

export function createStores(config: StorageBackendConfig): StoreSet {
  if (config.backend === "sqlite") {
    const dbPath = join(config.baseDir, "openmembrain.db");
    const db = openDatabase(dbPath);
    return {
      memoryStore: new SqliteMemoryStore(db),
      pendingCandidateStore: new SqlitePendingCandidateStore(db),
      auditLogStore: new SqliteAuditLogStore(db),
      diagnosticsLogStore: new SqliteDiagnosticsLogStore(db),
      close: () => db.close(),
    };
  }

  return {
    memoryStore: new JsonMemoryStore(config.baseDir),
    pendingCandidateStore: new JsonPendingCandidateStore(config.baseDir),
    auditLogStore: new JsonAuditLogStore(config.baseDir),
    diagnosticsLogStore: new JsonDiagnosticsLogStore(config.baseDir),
  };
}
