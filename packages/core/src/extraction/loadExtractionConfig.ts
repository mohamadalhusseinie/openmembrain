import { env } from "node:process";
import { defaultExtractionConfig, type ExtractionConfig, type ExtractionProvider } from "./ExtractionConfig";

export function loadExtractionConfig(): ExtractionConfig {
  const provider = (env.OPENMEMBRAIN_EXTRACTION_PROVIDER as ExtractionProvider | undefined) ?? defaultExtractionConfig.provider;
  const enabled = env.OPENMEMBRAIN_EXTRACTION_ENABLED === "true";
  const apiKey = env.OPENMEMBRAIN_OPENAI_API_KEY;
  const model = env.OPENMEMBRAIN_OPENAI_MODEL;
  const baseUrl = env.OPENMEMBRAIN_OPENAI_BASE_URL;

  return {
    provider,
    enabled,
    ...(apiKey !== undefined ? { apiKey } : {}),
    ...(model !== undefined ? { model } : {}),
    ...(baseUrl !== undefined ? { baseUrl } : {})
  };
}
