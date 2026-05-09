import { describe, it, expect, afterEach, vi } from "vitest";
import { loadExtractionConfig } from "@openmembrain/core";

describe("loadExtractionConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default mock config when no env vars set", () => {
    const config = loadExtractionConfig();
    expect(config.provider).toBe("mock");
    expect(config.enabled).toBe(false);
    expect(config).not.toHaveProperty("apiKey");
    expect(config).not.toHaveProperty("model");
    expect(config).not.toHaveProperty("baseUrl");
  });

  it("reads provider from OPENMEMBRAIN_EXTRACTION_PROVIDER", () => {
    vi.stubEnv("OPENMEMBRAIN_EXTRACTION_PROVIDER", "openai");
    const config = loadExtractionConfig();
    expect(config.provider).toBe("openai");
  });

  it("reads apiKey from OPENMEMBRAIN_OPENAI_API_KEY", () => {
    vi.stubEnv("OPENMEMBRAIN_OPENAI_API_KEY", "sk-test-123");
    const config = loadExtractionConfig();
    expect(config.apiKey).toBe("sk-test-123");
  });

  it("reads model from OPENMEMBRAIN_OPENAI_MODEL", () => {
    vi.stubEnv("OPENMEMBRAIN_OPENAI_MODEL", "gpt-4o");
    const config = loadExtractionConfig();
    expect(config.model).toBe("gpt-4o");
  });

  it("reads baseUrl from OPENMEMBRAIN_OPENAI_BASE_URL", () => {
    vi.stubEnv("OPENMEMBRAIN_OPENAI_BASE_URL", "https://custom.api.com");
    const config = loadExtractionConfig();
    expect(config.baseUrl).toBe("https://custom.api.com");
  });

  it("treats enabled=false correctly", () => {
    vi.stubEnv("OPENMEMBRAIN_EXTRACTION_ENABLED", "false");
    const config = loadExtractionConfig();
    expect(config.enabled).toBe(false);
  });

  it("defaults enabled to false when env var missing", () => {
    const config = loadExtractionConfig();
    expect(config.enabled).toBe(false);
  });
});
