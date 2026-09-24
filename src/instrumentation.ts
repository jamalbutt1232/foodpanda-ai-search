/**
 * Runs once when the Next.js server starts. Validates env so misconfiguration
 * fails fast in production; in development it only warns, so pages that don't
 * need the DB or LLM still render while keys are being set up.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { parseEnv, EnvValidationError } = await import("@/lib/env");
  try {
    parseEnv(process.env);
  } catch (error) {
    if (process.env.NODE_ENV === "production" || !(error instanceof EnvValidationError)) {
      throw error;
    }
    console.warn(`[env] ${error.message}\nCopy .env.example to .env.local and fill it in.`);
  }
}
