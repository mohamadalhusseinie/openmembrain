export interface SessionInput {
  projectId: string;
  transcript?: string;
  summary?: string;
  tool?: string;
  sessionId?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
}

export function getSessionText(input: SessionInput): string {
  return [input.summary, input.transcript].filter(Boolean).join("\n\n");
}
