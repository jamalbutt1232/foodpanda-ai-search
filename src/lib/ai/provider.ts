import type { z } from "zod";
import { getLlmEnv, type LLMProviderName } from "@/lib/env";

export const LLM_TIMEOUT_MS = 10_000;
export const LLM_TEMPERATURE = 0.2;

export type LLMErrorKind = "timeout" | "rate_limit" | "unavailable" | "invalid_output" | "other";

export class LLMError extends Error {
  constructor(
    public readonly kind: LLMErrorKind,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "LLMError";
  }
}

/** "fast" for simple extraction (query parsing), "smart" for ranking and picking. */
export type ModelTier = "fast" | "smart";

export interface ProviderModels {
  smart: string;
  fast: string;
  /** Tried once when the tier's model is rate-limited or overloaded (separate free-tier quota). */
  backup: string;
}

export interface CompleteJSONOptions<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  tier?: ModelTier;
}

export interface LLMProvider {
  readonly name: LLMProviderName;
  readonly models: ProviderModels;
  /** Returns schema-validated JSON or throws LLMError. */
  completeJSON<T>(options: CompleteJSONOptions<T>): Promise<T>;
}

/** Provider-specific part: one text completion in JSON mode. */
export type GenerateText = (args: {
  model: string;
  system: string;
  user: string;
  signal: AbortSignal;
}) => Promise<string>;

/** Removes ```json fences and any prose around the outermost JSON object. */
export function extractJson(text: string): string {
  const unfenced = text.replace(/```(?:json)?/gi, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  return start !== -1 && end > start ? unfenced.slice(start, end + 1) : unfenced;
}

export function parseJsonWith<T>(text: string, schema: z.ZodType<T>): T {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJson(text));
  } catch (error) {
    throw new LLMError("invalid_output", "Model did not return valid JSON", { cause: error });
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new LLMError("invalid_output", `JSON did not match the schema: ${detail}`, {
      cause: result.error,
    });
  }
  return result.data;
}

/** Maps SDK errors (all three expose an HTTP `status`) to our error kinds. */
export function classifyError(error: unknown): LLMError {
  if (error instanceof LLMError) return error;
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status: unknown }).status)
      : undefined;
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);

  if (name === "AbortError" || name === "TimeoutError" || /timed? ?out|aborted/i.test(message)) {
    return new LLMError("timeout", `LLM request timed out after ${LLM_TIMEOUT_MS}ms`, {
      cause: error,
    });
  }
  if (status === 429) return new LLMError("rate_limit", "LLM rate limit reached", { cause: error });
  if (status !== undefined && (status >= 500 || status === 408)) {
    return new LLMError("unavailable", `LLM unavailable (HTTP ${status})`, { cause: error });
  }
  return new LLMError("other", `LLM request failed: ${message.slice(0, 200)}`, { cause: error });
}

/** Overload errors come back fast, and free-tier quotas are per model, so the backup model is worth one try. */
const RETRY_ON_OTHER_MODEL: LLMErrorKind[] = ["rate_limit", "unavailable"];

export function createProvider(
  name: LLMProviderName,
  models: ProviderModels,
  generate: GenerateText,
): LLMProvider {
  const call = async (model: string, system: string, user: string) => {
    try {
      return await generate({ model, system, user, signal: AbortSignal.timeout(LLM_TIMEOUT_MS) });
    } catch (error) {
      throw classifyError(error);
    }
  };

  return {
    name,
    models,
    async completeJSON<T>({
      system,
      user,
      schema,
      tier = "smart",
    }: CompleteJSONOptions<T>): Promise<T> {
      const primary = models[tier];
      const backup = models.backup;
      let text: string;
      try {
        text = await call(primary, system, user);
      } catch (error) {
        const retryable =
          error instanceof LLMError &&
          RETRY_ON_OTHER_MODEL.includes(error.kind) &&
          backup !== primary;
        if (!retryable) throw error;
        text = await call(backup, system, user);
      }
      return parseJsonWith(text, schema);
    },
  };
}

let cached: LLMProvider | undefined;

/** Server-only. The provider selected by LLM_PROVIDER, created once. */
export async function getProvider(): Promise<LLMProvider> {
  if (cached) return cached;
  const env = getLlmEnv();
  const models: ProviderModels = {
    smart: env.LLM_MODEL,
    fast: env.LLM_FAST_MODEL,
    backup: env.LLM_BACKUP_MODEL,
  };
  switch (env.LLM_PROVIDER) {
    case "gemini": {
      const { createGeminiProvider } = await import("@/lib/ai/gemini");
      cached = createGeminiProvider(env.GEMINI_API_KEY ?? "", models);
      break;
    }
    case "groq": {
      const { createGroqProvider } = await import("@/lib/ai/groq");
      cached = createGroqProvider(env.GROQ_API_KEY ?? "", models);
      break;
    }
    case "anthropic": {
      const { createAnthropicProvider } = await import("@/lib/ai/anthropic");
      cached = createAnthropicProvider(env.ANTHROPIC_API_KEY ?? "", models);
      break;
    }
  }
  return cached;
}
