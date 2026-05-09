import { OpenMembrainError } from "../errors/OpenMembrainError";
import type { ExtractionConfig } from "./ExtractionConfig";
import { validateExtractionConfig } from "./ExtractionConfig";
import type { MemoryExtractor } from "./MemoryExtractor";
import { MockMemoryExtractor } from "./MockMemoryExtractor";
import { OpenAiMemoryExtractor, type OnExtractionDiagnostics } from "./OpenAiMemoryExtractor";

export interface CreateExtractorOptions {
  onDiagnostics?: OnExtractionDiagnostics | undefined;
}

export function createExtractor(
  config: ExtractionConfig,
  options?: CreateExtractorOptions
): MemoryExtractor {
  const validation = validateExtractionConfig(config);
  if (!validation.ok) {
    throw validation.error;
  }

  if (!config.enabled || config.provider === "mock") {
    return new MockMemoryExtractor();
  }

  if (config.provider === "openai") {
    return new OpenAiMemoryExtractor(config, {
      ...(options?.onDiagnostics !== undefined ? { onDiagnostics: options.onDiagnostics } : {})
    });
  }

  throw new OpenMembrainError({
    code: "EXTRACTION_CONFIG_ERROR",
    message: `Provider "${config.provider}" is not yet supported. Supported providers: mock, openai.`,
    safeMessage: `Provider "${config.provider}" is not yet supported.`
  });
}
