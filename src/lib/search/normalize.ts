import type { Constraints } from "@/lib/ai/schemas";
import type { CookingMethod } from "@/lib/db/enums";

/** Menu categories that exist in the data. */
export const KNOWN_CATEGORIES = [
  "burger",
  "sandwich",
  "wrap",
  "pizza",
  "desi",
  "bbq",
  "chinese",
  "platter",
  "bowl",
  "salad",
  "soup",
  "wings",
  "fries",
  "sides",
  "bread",
  "dessert",
  "drink",
] as const;

/** User words → menu category. Keys are singular, lowercase. */
const CATEGORY_SYNONYMS: Record<string, string> = {
  chip: "fries",
  chips: "fries",
  "french fry": "fries",
  "french fries": "fries",
  fry: "fries",
  wedge: "fries",
  wedges: "fries",
  drink: "drink",
  "cold drink": "drink",
  "soft drink": "drink",
  soda: "drink",
  coke: "drink",
  pepsi: "drink",
  juice: "drink",
  beverage: "drink",
  roll: "wrap",
  "paratha roll": "wrap",
  shawarma: "wrap",
  sub: "sandwich",
  panini: "sandwich",
  karahi: "desi",
  biryani: "desi",
  curry: "desi",
  daal: "desi",
  pakistani: "desi",
  tikka: "bbq",
  kabab: "bbq",
  kebab: "bbq",
  "seekh kabab": "bbq",
  grill: "bbq",
  noodle: "chinese",
  "chow mein": "chinese",
  "fried rice": "chinese",
  naan: "bread",
  roti: "bread",
  cake: "dessert",
  sweet: "dessert",
  "ice cream": "dessert",
  wing: "wings",
  "rice bowl": "bowl",
};

const DIETARY_SYNONYMS: Record<string, string> = {
  high_protein: "high_protein",
  "high protein": "high_protein",
  protein: "high_protein",
  vegetarian: "vegetarian",
  veg: "vegetarian",
  veggie: "vegetarian",
  low_carb: "low_carb",
  "low carb": "low_carb",
  keto: "low_carb",
  spicy: "spicy",
};

export const HEALTHY_METHODS: CookingMethod[] = ["grilled", "steamed", "raw", "air_fried"];
export const HEALTHY_MAX_CALORIES = 550;

/** Words that describe an occasion, not a dish; they'd only add noise as dish types. */
const GENERIC_DISH_WORDS = new Set([
  "meal",
  "food",
  "dish",
  "dinner",
  "lunch",
  "breakfast",
  "snack",
  "something",
]);

const HEALTHY_WORDS = /\b(healthy|light|lean|clean|diet)\b/i;
const CHEAPEST_WORDS = /\b(cheap|cheapest|budget|affordable|sasta|lowest price)\b/i;

/** Constraints after synonym mapping, plus flags the pipeline needs. */
export interface SearchPlan {
  constraints: Constraints;
  /** Menu categories to filter on (from dishTypes). */
  categories: string[];
  healthy: boolean;
  preferCheapest: boolean;
}

function singular(word: string): string {
  if (word === "fries" || word === "chips" || word.endsWith("ss")) return word;
  if (word.endsWith("ches") || word.endsWith("shes")) return word.slice(0, -2);
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  return word.endsWith("s") ? word.slice(0, -1) : word;
}

/** "Burgers" → "burger", "chips" → "fries", "shawarma" → "wrap"; unknown words → null. */
export function toCategory(word: string): string | null {
  const w = word.trim().toLowerCase().replace(/[_-]+/g, " ");
  const candidates = [w, singular(w)];
  for (const c of candidates) {
    if ((KNOWN_CATEGORIES as readonly string[]).includes(c)) return c;
    if (CATEGORY_SYNONYMS[c]) return CATEGORY_SYNONYMS[c];
  }
  return null;
}

/** Maps a word to its category name when known, otherwise its singular form. */
function canonicalDish(word: string): string {
  return toCategory(word) ?? singular(word.trim().toLowerCase());
}

const unique = <T>(list: T[]): T[] => [...new Set(list)];

export function normalizeConstraints(raw: Constraints, query: string): SearchPlan {
  const c: Constraints = structuredClone(raw);

  c.dishTypes = unique(c.dishTypes.map(canonicalDish)).filter((d) => !GENERIC_DISH_WORDS.has(d));
  c.requiredCategories = unique(
    c.requiredCategories.map((w) => toCategory(w)).filter((w): w is string => w !== null),
  );
  c.dietaryTags = unique(
    c.dietaryTags
      .map((t) => DIETARY_SYNONYMS[t.replace(/_/g, " ")] ?? DIETARY_SYNONYMS[t])
      .filter((t): t is string => Boolean(t)),
  );
  c.excludeIngredients = unique(c.excludeIngredients.map((i) => singular(i)));
  c.includeIngredients = unique(c.includeIngredients.map((i) => singular(i)));
  // Something can't be both wanted and avoided.
  c.cookingMethods = c.cookingMethods.filter((m) => !c.avoidCookingMethods.includes(m));

  const healthy = HEALTHY_WORDS.test(query) || HEALTHY_WORDS.test(c.notes);
  if (healthy) {
    if (c.cookingMethods.length === 0) {
      c.cookingMethods = HEALTHY_METHODS.filter((m) => !c.avoidCookingMethods.includes(m));
    }
    c.maxCalories = Math.min(c.maxCalories ?? HEALTHY_MAX_CALORIES, HEALTHY_MAX_CALORIES);
  }

  // Intent is decided by the numbers, not only by the model's label.
  // A group order needs people to feed, or a total budget spread over several categories.
  const isGroup =
    (c.partySize ?? 0) >= 2 || (c.budget !== null && c.requiredCategories.length >= 2);
  if (isGroup) {
    c.intent = "group_budget";
    c.partySize ??= 1;
    if (c.requiredCategories.length === 0) {
      c.requiredCategories = unique(
        c.dishTypes.map((d) => toCategory(d)).filter((d): d is string => d !== null),
      );
    }
    // "desi food for 2": a cuisine that is also a menu category must be on the order.
    const cuisineCategory = c.cuisine ? toCategory(c.cuisine) : null;
    if (cuisineCategory && !c.requiredCategories.includes(cuisineCategory)) {
      c.requiredCategories.push(cuisineCategory);
    }
  } else {
    c.intent = "single_dish";
    if (c.budget !== null && c.maxPricePerItem === null) c.maxPricePerItem = c.budget;
    c.budget = null;
    c.partySize = null;
    c.requiredCategories = [];
  }

  const categories = unique(
    c.dishTypes.map((d) => toCategory(d)).filter((d): d is string => d !== null),
  );

  return {
    constraints: c,
    categories,
    healthy,
    preferCheapest: CHEAPEST_WORDS.test(query),
  };
}
