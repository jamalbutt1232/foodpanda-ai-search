import { COOKING_METHOD_LABELS } from "@/lib/format/labels";
import { formatPkr } from "@/lib/format/formatPkr";
import type { Constraints } from "@/lib/ai/schemas";
import type { MenuItemDoc } from "@/lib/db";

/** Small numbers are quantities/people ("2 burgers", "6 people") and don't need checking. */
const FREE_NUMBER_LIMIT = 25;

export function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().replace(/\s+/g, " ").split(" ");
  return words.length <= maxWords ? words.join(" ") : `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * True when every significant number in the reason matches a known fact
 * (within ±1 for rounding). Guards against invented prices or calories.
 */
export function reasonNumbersAreFactual(reason: string, facts: number[]): boolean {
  const numbers = [...reason.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) =>
    Number(m[0].replace(/,/g, "")),
  );
  return numbers.every(
    (n) => n <= FREE_NUMBER_LIMIT || facts.some((fact) => Math.abs(fact - n) <= 1),
  );
}

/** Deterministic reason built from item data, used when the model's reason fails checks. */
export function factualItemReason(item: MenuItemDoc, c: Constraints): string {
  const parts: string[] = [];
  const matched = c.includeIngredients.filter((w) =>
    item.ingredients.some((ing) => ing.toLowerCase().includes(w)),
  );
  parts.push(
    `${COOKING_METHOD_LABELS[item.cookingMethod]} ${item.category}` +
      (matched.length > 0 ? ` with ${matched.join(" and ")}` : ""),
  );
  parts.push(`${item.calories} kcal`);
  if (item.proteinGrams !== null) parts.push(`${item.proteinGrams}g protein`);
  parts.push(formatPkr(item.price));
  return `${parts.join(", ")}.`;
}

export function itemFacts(item: MenuItemDoc, c: Constraints, extra: number[] = []): number[] {
  return [
    item.price,
    item.calories,
    item.proteinGrams ?? 0,
    item.servesPeople,
    c.targetCalories ?? 0,
    c.maxCalories ?? 0,
    c.maxPricePerItem ?? 0,
    ...extra,
  ].filter((n) => n > 0);
}
