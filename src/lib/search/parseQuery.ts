import { PARSE_SYSTEM_PROMPT, parseRetryPrompt, parseUserPrompt } from "@/lib/ai/prompts";
import { LLMError, type LLMProvider } from "@/lib/ai/provider";
import { constraintsSchema, type Constraints } from "@/lib/ai/schemas";

export interface ParseResult {
  constraints: Constraints;
  llmCalls: number;
  ms: number;
}

/** Query → validated Constraints. One retry, with the validation error, on bad output. */
export async function parseQuery(provider: LLMProvider, query: string): Promise<ParseResult> {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  try {
    const constraints = await provider.completeJSON({
      system: PARSE_SYSTEM_PROMPT,
      user: parseUserPrompt(query),
      schema: constraintsSchema,
      tier: "fast",
    });
    return { constraints, llmCalls: 1, ms: ms() };
  } catch (error) {
    if (!(error instanceof LLMError) || error.kind !== "invalid_output") throw error;
    const constraints = await provider.completeJSON({
      system: PARSE_SYSTEM_PROMPT,
      user: parseRetryPrompt(query, error.message),
      schema: constraintsSchema,
      tier: "fast",
    });
    return { constraints, llmCalls: 2, ms: ms() };
  }
}
