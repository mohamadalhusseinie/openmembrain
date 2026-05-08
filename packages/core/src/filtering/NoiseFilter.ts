export interface NoiseFinding {
  code: "stack_trace" | "temporary_log" | "large_code_block" | "raw_code";
  reason: string;
}

export class NoiseFilter {
  findNoise(content: string): NoiseFinding[] {
    const findings: NoiseFinding[] = [];

    if (
      /(^|\n)\s+at\s+.+:\d+:\d+/i.test(content) ||
      /\bTraceback \(most recent call last\)/i.test(content) ||
      /\b(stack trace|exception in thread|segmentation fault|panic:)\b/i.test(content)
    ) {
      findings.push({
        code: "stack_trace",
        reason: "Temporary stack traces are not durable project memory."
      });
    }

    if (/\b(DEBUG|TRACE|INFO|WARN|ERROR)\b.+\b(request|response|localhost|pid|ms)\b/i.test(content)) {
      findings.push({
        code: "temporary_log",
        reason: "Temporary log output is not durable project memory."
      });
    }

    const codeBlockMatch = content.match(/```[\s\S]*```/);
    if (codeBlockMatch && codeBlockMatch[0].length > 500) {
      findings.push({
        code: "large_code_block",
        reason: "Large raw code blocks should not be persisted as memory."
      });
    }

    if (looksLikeRawCode(content)) {
      findings.push({
        code: "raw_code",
        reason: "Raw source code should not be persisted as memory."
      });
    }

    return findings;
  }

  isNoisy(content: string): boolean {
    return this.findNoise(content).length > 0;
  }
}

function looksLikeRawCode(content: string): boolean {
  if (content.length < 500) {
    return false;
  }

  const lines = content.split(/\r?\n/);
  const codeishLines = lines.filter((line) =>
    /^\s*(import|export|const|let|var|function|class|interface|type|if|for|while|return)\b/.test(line)
  ).length;

  return codeishLines >= 8;
}
