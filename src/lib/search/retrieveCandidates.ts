import type { Constraints } from "@/lib/ai/schemas";
import type { DealDoc, MenuItemDoc, RestaurantDoc } from "@/lib/db";
import type { AreaMenu } from "@/lib/search/areaMenu";
import type { SearchPlan } from "@/lib/search/normalize";

export const MIN_CANDIDATES = 10;
export const MAX_CANDIDATES = 60;
export const CALORIE_TOLERANCE = 0.25;

const NOT_A_MEAL = new Set(["drink", "dessert"]);

export type RelaxedFilter = "calories" | "cookingMethod" | "category";

/** Filters that can be dropped, in the order they are dropped. */
const LOOSEN_ORDER: RelaxedFilter[] = ["calories", "cookingMethod", "category"];

export interface Candidate {
  item: MenuItemDoc;
  restaurant: RestaurantDoc;
}

export interface CandidateResult {
  candidates: Candidate[];
  relaxed: RelaxedFilter[];
  /** Candidates that passed every filter before any loosening. */
  exactCount: number;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function mentions(item: MenuItemDoc, word: string): boolean {
  const re = new RegExp(`\\b${escapeRegex(word)}`, "i");
  return (
    item.ingredients.some((ing) => re.test(ing)) || re.test(item.name) || re.test(item.description)
  );
}

/** Never loosened: price cap, exclusions, avoided cooking methods, dietary tags. */
export function passesHardFilters(item: MenuItemDoc, c: Constraints): boolean {
  if (c.maxPricePerItem !== null && item.price > c.maxPricePerItem) return false;
  if (c.excludeIngredients.some((word) => mentions(item, word))) return false;
  if (c.avoidCookingMethods.includes(item.cookingMethod)) return false;
  if (!c.dietaryTags.every((tag) => item.dietaryTags.includes(tag))) return false;
  if (c.onlyIngredients && !c.includeIngredients.every((word) => mentions(item, word))) {
    return false;
  }
  return true;
}

function passesCalories(item: MenuItemDoc, c: Constraints): boolean {
  if (c.maxCalories !== null && item.calories > c.maxCalories) return false;
  if (c.targetCalories !== null) {
    const low = c.targetCalories * (1 - CALORIE_TOLERANCE);
    const high = c.targetCalories * (1 + CALORIE_TOLERANCE);
    if (item.calories < low || item.calories > high) return false;
  }
  return true;
}

function passesSoftFilters(item: MenuItemDoc, plan: SearchPlan, relaxed: RelaxedFilter[]) {
  const c = plan.constraints;
  if (!relaxed.includes("calories") && !passesCalories(item, c)) return false;
  if (
    !relaxed.includes("cookingMethod") &&
    c.cookingMethods.length > 0 &&
    !c.cookingMethods.includes(item.cookingMethod)
  ) {
    return false;
  }
  // Drinks and desserts aren't a meal unless asked for, even after loosening.
  if (NOT_A_MEAL.has(item.category) && !plan.categories.includes(item.category)) return false;
  if (!relaxed.includes("category") && plan.categories.length > 0) {
    return plan.categories.includes(item.category);
  }
  return true;
}

/** Cheap relevance estimate used to pick the best 60 before the LLM sees them. */
function preScore(item: MenuItemDoc, restaurant: RestaurantDoc, plan: SearchPlan): number {
  const c = plan.constraints;
  let score = 0;
  score += c.includeIngredients.filter((w) => mentions(item, w)).length * 3;
  score += c.dishTypes.filter((d) => mentions(item, d)).length * 2;
  if (plan.categories.includes(item.category)) score += 3;
  if (c.cookingMethods.includes(item.cookingMethod)) score += 2;
  if (passesCalories(item, c) && (c.targetCalories !== null || c.maxCalories !== null)) score += 2;
  if (c.targetCalories !== null) {
    score -= Math.min(2, Math.abs(item.calories - c.targetCalories) / c.targetCalories) * 2;
  }
  if (c.dietaryTags.includes("high_protein")) score += (item.proteinGrams ?? 0) / 15;
  if (c.cuisine && restaurant.cuisine.toLowerCase().includes(c.cuisine)) score += 2;
  return score + restaurant.rating * 0.3;
}

/**
 * Pure filtering: hard filters always apply; soft filters are dropped one at a
 * time (calories → cooking method → category) until there are enough candidates.
 */
export function filterCandidates(
  menu: Pick<AreaMenu, "items" | "restaurants">,
  plan: SearchPlan,
): CandidateResult {
  const base: Candidate[] = menu.items.flatMap((item) => {
    const restaurant = menu.restaurants.get(item.restaurantId);
    return restaurant && item.isAvailable && passesHardFilters(item, plan.constraints)
      ? [{ item, restaurant }]
      : [];
  });

  const relaxed: RelaxedFilter[] = [];
  let matches = base.filter((c) => passesSoftFilters(c.item, plan, relaxed));
  const exactCount = matches.length;
  for (const next of LOOSEN_ORDER) {
    if (matches.length >= MIN_CANDIDATES) break;
    relaxed.push(next);
    matches = base.filter((c) => passesSoftFilters(c.item, plan, relaxed));
  }

  const candidates = matches
    .map((c) => ({ c, score: preScore(c.item, c.restaurant, plan) }))
    .sort((a, b) => b.score - a.score || b.c.restaurant.rating - a.c.restaurant.rating)
    .slice(0, MAX_CANDIDATES)
    .map(({ c }) => c);

  return { candidates, relaxed, exactCount };
}

/** Deals usable for a group order: every line must pass the hard filters. */
export function filterDeals(
  menu: Pick<AreaMenu, "deals" | "itemsById" | "restaurants">,
  c: Constraints,
): DealDoc[] {
  return menu.deals.filter((deal) => {
    if (!deal.isAvailable || !menu.restaurants.has(deal.restaurantId)) return false;
    if (deal.items.length === 0) return false;
    return deal.items.every((line) => {
      const item = menu.itemsById.get(line.menuItemId);
      // Price cap is per item, not per deal, so ignore it here.
      return item !== undefined && passesHardFilters(item, { ...c, maxPricePerItem: null });
    });
  });
}
