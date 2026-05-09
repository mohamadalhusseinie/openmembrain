import { OpenMembrainError } from "../errors/OpenMembrainError.js";
import type { ExtractionConfig } from "./ExtractionConfig.js";
import { validateExtractionConfig } from "./ExtractionConfig.js";
import type { MemoryExtractor } from "./MemoryExtractor.js";
import { MockMemoryExtractor } from "./MockMemoryExtractor.js";
import { OpenAiMemoryExtractor, type OnExtractionDiagnostics } from "./OpenAiMemoryExtractor.js";

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
