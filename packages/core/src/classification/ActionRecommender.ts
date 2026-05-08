import type { MemoryCandidate, RecommendedAction } from "../types/MemoryCandidate";

export interface RecommendationContext {
  hasConflict: boolean;
  isDuplicate: boolean;
}

export class ActionRecommender {
  recommend(candidate: MemoryCandidate, context: RecommendationContext): RecommendedAction {
    if (candidate.sensitivity === "secret" || candidate.confidence === "low" || context.isDuplicate) {
      return "reject";
    }

    if (context.hasConflict) {
      return "ask_user";
    }

    if (
      candidate.type === "architecture_decision" ||
      candidate.type === "security_rule" ||
      candidate.type === "deployment_rule" ||
      candidate.type === "forbidden_pattern" ||
      candidate.type === "session_summary" ||
      candidate.sensitivity === "confidential"
    ) {
      return "ask_user";
    }

    if (
      candidate.confidence === "high" &&
      (candidate.type === "project_fact" || candidate.type === "coding_rule" || candidate.type === "testing_rule") &&
      (candidate.sensitivity === "public" || candidate.sensitivity === "internal")
    ) {
      return "auto_save";
    }

    return "ask_user";
  }
}
