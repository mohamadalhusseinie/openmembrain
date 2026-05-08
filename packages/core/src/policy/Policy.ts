import type { MemoryType } from "../types/MemoryCandidate";

export interface MemoryPolicy {
  maxContentLength: number;
  maxRawCodeBlockLength: number;
  autoSaveTypes: MemoryType[];
  askUserTypes: MemoryType[];
}

export const defaultMemoryPolicy: MemoryPolicy = {
  maxContentLength: 1000,
  maxRawCodeBlockLength: 500,
  autoSaveTypes: ["project_fact", "coding_rule", "testing_rule"],
  askUserTypes: [
    "architecture_decision",
    "known_gotcha",
    "deployment_rule",
    "security_rule",
    "forbidden_pattern",
    "domain_knowledge",
    "session_summary"
  ]
};
