import { z } from "zod";
import { COOKING_METHODS } from "@/lib/db/enums";

/** LLMs sometimes send numbers as strings ("300") or omit fields; accept both. */
const nullableNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value),
    z.number().min(min).max(max).nullable().catch(null),
  );

const stringList = z
  .array(z.string())
  .catch([])
  .default([])
  .transform((list) => [...new Set(list.map((s) => s.trim().toLowerCase()).filter(Boolean))]);

const cookingMethodList = z
  .array(z.string())
  .catch([])
  .default([])
  .transform((list) =>
    [
      ...new Set(
        list.map((s) =>
          s
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_"),
        ),
      ),
    ].filter((s): s is (typeof COOKING_METHODS)[number] =>
      (COOKING_METHODS as readonly string[]).includes(s),
    ),
  );

export const constraintsSchema = z.object({
  intent: z.enum(["single_dish", "group_budget"]),
  dishTypes: stringList,
  includeIngredients: stringList,
  excludeIngredients: stringList,
  onlyIngredients: z.boolean().catch(false).default(false),
  cookingMethods: cookingMethodList,
  avoidCookingMethods: cookingMethodList,
  targetCalories: nullableNumber(0, 5000).default(null),
  maxCalories: nullableNumber(0, 5000).default(null),
  maxPricePerItem: nullableNumber(0, 100_000).default(null),
  budget: nullableNumber(0, 1_000_000).default(null),
  partySize: nullableNumber(1, 100).default(null),
  requiredCategories: stringList,
  dietaryTags: stringList,
  cuisine: z
    .string()
    .nullable()
    .catch(null)
    .default(null)
    .transform((s) => (s?.trim() ? s.trim().toLowerCase() : null)),
  notes: z.string().catch("").default(""),
});

export type Constraints = z.infer<typeof constraintsSchema>;

export const rankResponseSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      matchScore: z.coerce.number().transform((n) => Math.round(Math.min(100, Math.max(0, n)))),
      reason: z.string().catch(""),
    }),
  ),
});

export type RankResponse = z.infer<typeof rankResponseSchema>;

export const comboPickSchema = z.object({
  picks: z.array(z.object({ comboId: z.string(), reason: z.string().catch("") })),
});

export type ComboPickResponse = z.infer<typeof comboPickSchema>;
