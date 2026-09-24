import Anthropic from "@anthropic-ai/sdk";
import {
  createProvider,
  LLM_TEMPERATURE,
  LLM_TIMEOUT_MS,
  type LLMProvider,
  type ProviderModels,
} from "@/lib/ai/provider";

/** No dedicated JSON mode here: the prompts demand JSON and the output is fence-stripped + Zod-validated. */
export function createAnthropicProvider(apiKey: string, models: ProviderModels): LLMProvider {
  const client = new Anthropic({ apiKey, timeout: LLM_TIMEOUT_MS, maxRetries: 0 });

  return createProvider("anthropic", models, async ({ model, system, user, signal }) => {
    const message = await client.messages.create(
      {
        model,
        max_tokens: 2048,
        temperature: LLM_TEMPERATURE,
        system,
        messages: [{ role: "user", content: user }],
      },
      { signal },
    );
    return message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  });
}
