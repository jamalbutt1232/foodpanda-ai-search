import { describe, expect, it } from "vitest";
import { DEFAULT_MODELS, EnvValidationError, parseDbEnv, parseEnv, parseLlmEnv } from "@/lib/env";

const base = {
  MONGODB_URI: "mongodb://localhost:27017/foodpanda_ai",
  GEMINI_API_KEY: "test-key",
};

describe("parseEnv", () => {
  it("defaults to gemini and its default model", () => {
    const env = parseEnv({ ...base, LLM_PROVIDER: "", LLM_MODEL: "" });
    expect(env.LLM_PROVIDER).toBe("gemini");
    expect(env.LLM_MODEL).toBe(DEFAULT_MODELS.gemini);
  });

  it("keeps an explicit model", () => {
    expect(parseEnv({ ...base, LLM_MODEL: "gemini-custom" }).LLM_MODEL).toBe("gemini-custom");
  });

  it("requires the API key for the selected provider only", () => {
    expect(() => parseEnv({ ...base, LLM_PROVIDER: "groq" })).toThrow(/GROQ_API_KEY/);
    const env = parseEnv({
      MONGODB_URI: base.MONGODB_URI,
      LLM_PROVIDER: "groq",
      GROQ_API_KEY: "k",
    });
    expect(env.LLM_PROVIDER).toBe("groq");
  });

  it("reports DB and LLM problems together", () => {
    try {
      parseEnv({ LLM_PROVIDER: "openai" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const issues = (error as EnvValidationError).issues.join("\n");
      expect(issues).toMatch(/MONGODB_URI/);
      expect(issues).toMatch(/LLM_PROVIDER/);
    }
  });
});

describe("parseDbEnv / parseLlmEnv", () => {
  it("validates the DB without needing LLM keys", () => {
    expect(parseDbEnv({ MONGODB_URI: base.MONGODB_URI }).MONGODB_URI).toBe(base.MONGODB_URI);
    expect(parseDbEnv({ MONGODB_URI: "mongodb+srv://u:p@c.mongodb.net/db" })).toBeTruthy();
  });

  it("rejects non-Mongo URIs", () => {
    expect(() => parseDbEnv({ MONGODB_URI: "postgresql://localhost/db" })).toThrow(/MONGODB_URI/);
    expect(() => parseDbEnv({})).toThrow(EnvValidationError);
  });

  it("validates LLM settings without needing the DB", () => {
    expect(parseLlmEnv({ GEMINI_API_KEY: "k" }).LLM_PROVIDER).toBe("gemini");
    expect(() => parseLlmEnv({})).toThrow(/GEMINI_API_KEY/);
  });
});
