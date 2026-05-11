import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export function openDatabase(filePath: string): Database.Database {
  mkdirSync(dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      scope TEXT NOT NULL,
      confidence TEXT NOT NULL,
      sensitivity TEXT NOT NULL,
      source TEXT NOT NULL,
      reason TEXT NOT NULL,
      tags TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      approvedAt TEXT,
      supersededBy TEXT,
      supersededAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_memories_projectId ON memories(projectId);
    CREATE INDEX IF NOT EXISTS idx_memories_status ON memories(status);

    CREATE TABLE IF NOT EXISTS pending_candidates (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      scope TEXT NOT NULL,
      confidence TEXT NOT NULL,
      sensitivity TEXT NOT NULL,
      source TEXT NOT NULL,
      reason TEXT NOT NULL,
      recommendedAction TEXT NOT NULL,
      tags TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      rejectionReason TEXT,
      duplicateOf TEXT,
      conflictWith TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_pending_projectId ON pending_candidates(projectId);

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      entityId TEXT,
      createdAt TEXT NOT NULL,
      details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_projectId ON audit_log(projectId);

    CREATE TABLE IF NOT EXISTS diagnostics_log (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      severity TEXT NOT NULL,
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      operation TEXT,
      source TEXT,
      entityId TEXT,
      createdAt TEXT NOT NULL,
      details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_diag_projectId ON diagnostics_log(projectId);
  `);
}
