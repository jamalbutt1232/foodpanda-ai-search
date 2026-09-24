import { GoogleGenAI, ThinkingLevel, type ThinkingConfig } from "@google/genai";
import {
  createProvider,
  LLM_TEMPERATURE,
  LLM_TIMEOUT_MS,
  type LLMProvider,
  type ProviderModels,
} from "@/lib/ai/provider";

/**
 * Keep "thinking" as low as the model allows: these are short extraction and
 * ranking tasks and latency matters more than deliberation.
 */
function fastThinking(model: string): ThinkingConfig {
  if (/^gemini-2\./.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-3\.[1-6]-flash/.test(model)) return { thinkingLevel: ThinkingLevel.MINIMAL };
  return { thinkingLevel: ThinkingLevel.LOW };
}

export function createGeminiProvider(apiKey: string, models: ProviderModels): LLMProvider {
  // No SDK retries: our keyword fallback handles failures within the latency budget.
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: LLM_TIMEOUT_MS, retryOptions: { attempts: 1 } },
  });
  return createProvider("gemini", models, async ({ model, system, user, signal }) => {
    const response = await client.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        temperature: LLM_TEMPERATURE,
        responseMimeType: "application/json",
        thinkingConfig: fastThinking(model),
        abortSignal: signal,
      },
    });
    return response.text ?? "";
  });
}
