import { describe, expect, it } from "vitest";
import { extractJson, LLMError, parseJsonWith } from "@/lib/ai/provider";
import { comboPickSchema, constraintsSchema, rankResponseSchema } from "@/lib/ai/schemas";
import { reasonNumbersAreFactual, truncateWords } from "@/lib/search/reasons";

describe("constraintsSchema", () => {
  it("fills defaults for missing fields", () => {
    const c = constraintsSchema.parse({ intent: "single_dish" });
    expect(c.dishTypes).toEqual([]);
    expect(c.targetCalories).toBeNull();
    expect(c.onlyIngredients).toBe(false);
    expect(c.notes).toBe("");
  });

  it("coerces string numbers and normalises cooking methods", () => {
    const c = constraintsSchema.parse({
      intent: "single_dish",
      targetCalories: "300",
      cookingMethods: ["Air-Fried", "grilled", "deep fried"],
      dishTypes: [" Sandwich ", "sandwich"],
    });
    expect(c.targetCalories).toBe(300);
    expect(c.cookingMethods).toEqual(["air_fried", "grilled"]);
    expect(c.dishTypes).toEqual(["sandwich"]);
  });

  it("rejects an unknown intent", () => {
    expect(constraintsSchema.safeParse({ intent: "order_pizza" }).success).toBe(false);
  });

  it("nulls out-of-range numbers instead of failing", () => {
    expect(constraintsSchema.parse({ intent: "group_budget", partySize: 0 }).partySize).toBeNull();
  });
});

describe("rank and combo schemas", () => {
  it("clamps and rounds match scores", () => {
    const r = rankResponseSchema.parse({
      results: [
        { id: "m1", matchScore: 140, reason: "x" },
        { id: "m2", matchScore: "87.6", reason: "y" },
      ],
    });
    expect(r.results.map((x) => x.matchScore)).toEqual([100, 88]);
  });

  it("requires comboId", () => {
    expect(comboPickSchema.safeParse({ picks: [{ reason: "no id" }] }).success).toBe(false);
  });
});

describe("JSON extraction", () => {
  it("strips code fences and surrounding prose", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(extractJson('Sure! {"a":1} Hope that helps')).toBe('{"a":1}');
  });

  it("throws invalid_output for bad JSON or schema mismatch", () => {
    const expectKind = (fn: () => unknown) => {
      try {
        fn();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).kind).toBe("invalid_output");
      }
    };
    expectKind(() => parseJsonWith("not json", constraintsSchema));
    expectKind(() => parseJsonWith('{"intent":"nope"}', constraintsSchema));
  });
});

describe("reason guard", () => {
  it("accepts reasons whose numbers match the data", () => {
    expect(reasonNumbersAreFactual("Grilled, 315 kcal and Rs. 1,250", [315, 1250])).toBe(true);
    expect(reasonNumbersAreFactual("Feeds 6 people with 2 burgers", [999])).toBe(true);
  });

  it("rejects invented numbers", () => {
    expect(reasonNumbersAreFactual("Only 250 kcal", [315, 1250])).toBe(false);
  });

  it("truncates to a word limit", () => {
    expect(truncateWords("one two three four", 2)).toBe("one two…");
  });
});
