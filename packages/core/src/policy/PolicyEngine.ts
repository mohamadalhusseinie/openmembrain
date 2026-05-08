import { NoiseFilter } from "../filtering/NoiseFilter";
import { SafetyFilter } from "../filtering/SafetyFilter";
import { SecretDetector } from "../filtering/SecretDetector";
import type { MemoryCandidate, Sensitivity } from "../types/MemoryCandidate";
import { defaultMemoryPolicy, type MemoryPolicy } from "./Policy";

export interface PolicyCheck {
  allowed: boolean;
  sensitivity: Sensitivity;
  violations: string[];
}

export class PolicyEngine {
  constructor(
    private readonly policy: MemoryPolicy = defaultMemoryPolicy,
    private readonly secretDetector = new SecretDetector(),
    private readonly noiseFilter = new NoiseFilter(),
    private readonly safetyFilter = new SafetyFilter()
  ) {}

  evaluate(candidate: MemoryCandidate): PolicyCheck {
    const violations: string[] = [];
    let sensitivity = candidate.sensitivity;

    if (this.secretDetector.containsSecret(candidate.content)) {
      sensitivity = "secret";
      violations.push("Contains a secret, credential, token, private key, database URL, or redacted secret.");
    }

    if (candidate.content.length > this.policy.maxContentLength) {
      violations.push("Memory content is too large for durable project knowledge.");
    }

    const codeBlockMatch = candidate.content.match(/```[\s\S]*```/);
    if (codeBlockMatch && codeBlockMatch[0].length > this.policy.maxRawCodeBlockLength) {
      violations.push("Contains a large raw code block.");
    }

    for (const finding of this.noiseFilter.findNoise(candidate.content)) {
      violations.push(finding.reason);
    }

    for (const finding of this.safetyFilter.findUnsafeDurabilitySignals(candidate.content)) {
      violations.push(finding.reason);
    }

    if (!candidate.content.trim()) {
      violations.push("Empty memory content.");
    }

    return {
      allowed: violations.length === 0,
      sensitivity,
      violations
    };
  }
}
