import type { CookingMethod } from "@/lib/db/enums";

/** Display order for menu sections; unknown categories go last, alphabetically. */
const CATEGORY_ORDER = [
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
];

const CATEGORY_LABELS: Record<string, string> = {
  burger: "Burgers",
  sandwich: "Sandwiches",
  wrap: "Wraps & Rolls",
  pizza: "Pizza",
  desi: "Desi",
  bbq: "BBQ",
  chinese: "Chinese",
  platter: "Platters",
  bowl: "Bowls",
  salad: "Salads",
  soup: "Soups",
  wings: "Wings",
  fries: "Fries",
  sides: "Sides",
  bread: "Breads",
  dessert: "Desserts",
  drink: "Drinks",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

export function compareCategories(a: string, b: string): number {
  const rank = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return rank(a) - rank(b) || a.localeCompare(b);
}

export const COOKING_METHOD_LABELS: Record<CookingMethod, string> = {
  fried: "Fried",
  air_fried: "Air-fried",
  grilled: "Grilled",
  baked: "Baked",
  steamed: "Steamed",
  raw: "Fresh / raw",
  other: "Other",
};

const DIETARY_TAG_LABELS: Record<string, string> = {
  high_protein: "High protein",
  vegetarian: "Vegetarian",
  low_carb: "Low carb",
  spicy: "Spicy",
};

export function dietaryTagLabel(tag: string): string {
  return DIETARY_TAG_LABELS[tag] ?? tag.replaceAll("_", " ");
}
