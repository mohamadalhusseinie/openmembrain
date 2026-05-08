import { z } from "zod";
import { memoryScopes, memoryTypes } from "@openmembrain/core";

export const projectIdSchema = {
  projectId: z.string().min(1).optional().describe("Project identifier. Defaults to OPENMEMBRAIN_PROJECT_ID or the current folder name.")
};

export const proposeMemoryFromSessionSchema = {
  ...projectIdSchema,
  transcript: z.string().min(1).optional().describe("AI coding session transcript. Raw full conversation storage is not persisted by default."),
  summary: z.string().min(1).optional().describe("AI coding session summary."),
  tool: z.string().min(1).optional().describe("Source AI tool or adapter name."),
  sessionId: z.string().min(1).optional().describe("Optional source session id."),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
};

export const getProjectRulesSchema = {
  ...projectIdSchema,
  scope: z.enum(memoryScopes).optional(),
  limit: z.number().int().positive().max(200).optional()
};

export const getRelevantContextSchema = {
  ...projectIdSchema,
  query: z.string().min(1),
  scope: z.enum(memoryScopes).optional(),
  limit: z.number().int().positive().max(50).optional()
};

export const searchMemorySchema = {
  ...projectIdSchema,
  query: z.string().optional(),
  scopes: z.array(z.enum(memoryScopes)).optional(),
  types: z.array(z.enum(memoryTypes)).optional(),
  tags: z.array(z.string().min(1)).optional(),
  limit: z.number().int().positive().max(200).optional()
};

export const listMemoryCandidatesSchema = {
  ...projectIdSchema,
  limit: z.number().int().positive().max(200).optional()
};

export const approveMemoryCandidateSchema = {
  ...projectIdSchema,
  candidateId: z.string().min(1)
};

export const rejectMemoryCandidateSchema = {
  ...projectIdSchema,
  candidateId: z.string().min(1),
  reason: z.string().min(1).optional()
};
