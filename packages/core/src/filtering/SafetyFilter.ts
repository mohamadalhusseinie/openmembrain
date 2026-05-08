export interface SafetyFinding {
  code: "generic_advice" | "emotional_commentary" | "unverified_guess";
  reason: string;
}

export class SafetyFilter {
  findUnsafeDurabilitySignals(content: string): SafetyFinding[] {
    const findings: SafetyFinding[] = [];

    if (/\b(write clean code|use best practices|make it better|be careful|keep it simple)\b/i.test(content)) {
      findings.push({
        code: "generic_advice",
        reason: "Generic programming advice is not project-specific memory."
      });
    }

    if (/\b(annoyed|frustrated|angry|happy|sad|the user was)\b/i.test(content)) {
      findings.push({
        code: "emotional_commentary",
        reason: "Emotional commentary is not durable project knowledge."
      });
    }

    if (/\b(maybe|probably|might|could be|i think|seems like|guess)\b/i.test(content)) {
      findings.push({
        code: "unverified_guess",
        reason: "Unverified guesses should not become persistent memory."
      });
    }

    return findings;
  }
}
