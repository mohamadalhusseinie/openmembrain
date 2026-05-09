import { describe, expect, it } from "vitest";
import {
  createExtractor,
  MockMemoryExtractor,
  OpenAiMemoryExtractor,
  type ExtractionConfig
} from "@openmembrain/core";
import { OpenMembrainError } from "@openmembrain/core";

describe("createExtractor", () => {
  it("returns MockMemoryExtractor when provider is 'mock'", () => {
    const config: ExtractionConfig = { provider: "mock", enabled: true };
    const extractor = createExtractor(config);
    expect(extractor).toBeInstanceOf(MockMemoryExtractor);
  });

  it("returns MockMemoryExtractor when enabled is false regardless of provider", () => {
    const config: ExtractionConfig = { provider: "openai", enabled: false };
    const extractor = createExtractor(config);
    expect(extractor).toBeInstanceOf(MockMemoryExtractor);
  });

  it("returns OpenAiMemoryExtractor when provider is 'openai' with valid config", () => {
    const config: ExtractionConfig = {
      provider: "openai",
      enabled: true,
      apiKey: "test-key"
    };
    const extractor = createExtractor(config);
    expect(extractor).toBeInstanceOf(OpenAiMemoryExtractor);
  });

  it("throws EXTRACTION_CONFIG_ERROR for openai without apiKey when enabled", () => {
    const config: ExtractionConfig = { provider: "openai", enabled: true };
    expect(() => createExtractor(config)).toThrow(OpenMembrainError);
    try {
      createExtractor(config);
    } catch (err) {
      expect(err).toBeInstanceOf(OpenMembrainError);
      expect((err as OpenMembrainError).code).toBe("EXTRACTION_CONFIG_ERROR");
    }
  });

  it("throws EXTRACTION_CONFIG_ERROR for unsupported provider 'anthropic'", () => {
    const config: ExtractionConfig = {
      provider: "anthropic",
      enabled: true,
      apiKey: "test-key"
    };
    expect(() => createExtractor(config)).toThrow(OpenMembrainError);
    try {
      createExtractor(config);
    } catch (err) {
      expect(err).toBeInstanceOf(OpenMembrainError);
      expect((err as OpenMembrainError).code).toBe("EXTRACTION_CONFIG_ERROR");
    }
  });
});
