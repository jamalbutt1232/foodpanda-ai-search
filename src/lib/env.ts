import { z } from "zod";

/** Treat empty strings from .env files as "not set". */
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

export const LLM_PROVIDERS = ["gemini", "groq", "anthropic"] as const;
export type LLMProviderName = (typeof LLM_PROVIDERS)[number];

/**
 * Small, fast models by default: good enough for these tasks and gentle on
 * free-tier quotas. Used when LLM_MODEL is empty: ranking and combo picks.
 */
export const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  gemini: "gemini-3.5-flash-lite",
  groq: "llama-3.3-70b-versatile",
  anthropic: "claude-sonnet-5",
};

/** Used when LLM_FAST_MODEL is empty: query parsing. */
export const DEFAULT_FAST_MODELS: Record<LLMProviderName, string> = {
  gemini: "gemini-3.5-flash-lite",
  groq: "llama-3.1-8b-instant",
  anthropic: "claude-haiku-4-5",
};

/** Used when LLM_BACKUP_MODEL is empty: one retry when the main model returns 429/503. */
export const DEFAULT_BACKUP_MODELS: Record<LLMProviderName, string> = {
  gemini: "gemini-3.1-flash-lite",
  groq: "llama-3.1-8b-instant",
  anthropic: "claude-haiku-4-5",
};

const API_KEY_FOR: Record<
  LLMProviderName,
  "GEMINI_API_KEY" | "GROQ_API_KEY" | "ANTHROPIC_API_KEY"
> = {
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

export const dbEnvSchema = z.object({
  MONGODB_URI: z.string({ message: "MONGODB_URI is required" }).regex(/^mongodb(\+srv)?:\/\/\S+$/, {
    message: "MONGODB_URI must start with mongodb:// or mongodb+srv://",
  }),
});

export const llmEnvSchema = z
  .object({
    LLM_PROVIDER: z.preprocess(
      (value) => (value === "" || value === undefined ? "gemini" : value),
      z.enum(LLM_PROVIDERS),
    ),
    LLM_MODEL: optionalString,
    LLM_FAST_MODEL: optionalString,
    LLM_BACKUP_MODEL: optionalString,
    GEMINI_API_KEY: optionalString,
    GROQ_API_KEY: optionalString,
    ANTHROPIC_API_KEY: optionalString,
  })
  .superRefine((env, ctx) => {
    const keyName = API_KEY_FOR[env.LLM_PROVIDER];
    if (!env[keyName]) {
      ctx.addIssue({
        code: "custom",
        path: [keyName],
        message: `${keyName} is required when LLM_PROVIDER=${env.LLM_PROVIDER}`,
      });
    }
  })
  .transform((env) => ({
    ...env,
    LLM_MODEL: env.LLM_MODEL ?? DEFAULT_MODELS[env.LLM_PROVIDER],
    LLM_FAST_MODEL: env.LLM_FAST_MODEL ?? DEFAULT_FAST_MODELS[env.LLM_PROVIDER],
    LLM_BACKUP_MODEL: env.LLM_BACKUP_MODEL ?? DEFAULT_BACKUP_MODELS[env.LLM_PROVIDER],
  }));

export type DbEnv = z.infer<typeof dbEnvSchema>;
export type LlmEnv = z.infer<typeof llmEnvSchema>;
export type Env = DbEnv & LlmEnv;

type EnvSource = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment variables:\n  - ${issues.join("\n  - ")}`);
    this.name = "EnvValidationError";
  }
}

function parseWith<T>(schema: z.ZodType<T>, source: EnvSource): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`),
    );
  }
  return result.data;
}

export const parseDbEnv = (source: EnvSource): DbEnv => parseWith(dbEnvSchema, source);
export const parseLlmEnv = (source: EnvSource): LlmEnv => parseWith(llmEnvSchema, source);

/** Validates everything, reporting DB and LLM issues together. */
export function parseEnv(source: EnvSource): Env {
  const issues: string[] = [];
  const collect = <T>(parse: () => T): T | undefined => {
    try {
      return parse();
    } catch (error) {
      if (!(error instanceof EnvValidationError)) throw error;
      issues.push(...error.issues);
      return undefined;
    }
  };
  const db = collect(() => parseDbEnv(source));
  const llm = collect(() => parseLlmEnv(source));
  if (!db || !llm) throw new EnvValidationError(issues);
  return { ...db, ...llm };
}

let cachedDb: DbEnv | undefined;
let cachedLlm: LlmEnv | undefined;

/** Server-only. DB settings, validated once. */
export function getDbEnv(): DbEnv {
  cachedDb ??= parseDbEnv(process.env);
  return cachedDb;
}

/** Server-only. LLM settings, validated once. */
export function getLlmEnv(): LlmEnv {
  cachedLlm ??= parseLlmEnv(process.env);
  return cachedLlm;
}
