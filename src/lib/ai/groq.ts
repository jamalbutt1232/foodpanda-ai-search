import OpenAI from "openai";
import {
  createProvider,
  LLM_TEMPERATURE,
  LLM_TIMEOUT_MS,
  type LLMProvider,
  type ProviderModels,
} from "@/lib/ai/provider";

/** Groq exposes an OpenAI-compatible API. */
export function createGroqProvider(apiKey: string, models: ProviderModels): LLMProvider {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: LLM_TIMEOUT_MS,
    maxRetries: 0, // our fallback handles failures; retries would blow the latency budget
  });

  return createProvider("groq", models, async ({ model, system, user, signal }) => {
    const completion = await client.chat.completions.create(
      {
        model,
        temperature: LLM_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { signal },
    );
    return completion.choices[0]?.message?.content ?? "";
  });
}
