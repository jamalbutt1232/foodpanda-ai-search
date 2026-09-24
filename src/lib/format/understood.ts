import type { Constraints } from "@/lib/ai/schemas";
import { COOKING_METHOD_LABELS, dietaryTagLabel } from "@/lib/format/labels";
import { formatPkr } from "@/lib/format/formatPkr";

export type ChipKind =
  "dish" | "include" | "exclude" | "method" | "nutrition" | "money" | "people" | "tag";

export interface UnderstoodChip {
  kind: ChipKind;
  label: string;
}

const HEALTHY_SET = ["grilled", "steamed", "raw", "air_fried"];

/** Turns parsed constraints into short, human chips: "~300 kcal", "no beef", "6 people". */
export function constraintsToChips(c: Constraints): UnderstoodChip[] {
  const chips: UnderstoodChip[] = [];
  const add = (kind: ChipKind, label: string) => {
    if (!chips.some((chip) => chip.label === label)) chips.push({ kind, label });
  };

  c.dishTypes.forEach((d) => add("dish", d));
  if (c.cuisine) add("dish", c.cuisine);
  c.requiredCategories
    .filter((cat) => !c.dishTypes.includes(cat))
    .forEach((cat) => add("dish", `with ${cat}`));

  c.includeIngredients.forEach((i) => add("include", c.onlyIngredients ? `only ${i}` : i));
  c.excludeIngredients.forEach((i) => add("exclude", `no ${i}`));

  const isHealthySet =
    c.cookingMethods.length === HEALTHY_SET.length &&
    HEALTHY_SET.every((m) => (c.cookingMethods as string[]).includes(m));
  if (isHealthySet) add("method", "healthy cooking");
  else c.cookingMethods.forEach((m) => add("method", COOKING_METHOD_LABELS[m].toLowerCase()));
  c.avoidCookingMethods.forEach((m) =>
    add("method", `not ${COOKING_METHOD_LABELS[m].toLowerCase()}`),
  );

  if (c.targetCalories !== null) add("nutrition", `~${c.targetCalories} kcal`);
  if (c.maxCalories !== null) add("nutrition", `under ${c.maxCalories} kcal`);
  c.dietaryTags.forEach((t) => add("tag", dietaryTagLabel(t).toLowerCase()));

  if (c.maxPricePerItem !== null) add("money", `under ${formatPkr(c.maxPricePerItem)}`);
  if (c.budget !== null) add("money", `budget ${formatPkr(c.budget)}`);
  if (c.partySize !== null && c.partySize > 1) add("people", `${c.partySize} people`);

  return chips;
}
