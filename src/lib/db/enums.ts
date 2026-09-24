export const COOKING_METHODS = [
  "fried",
  "air_fried",
  "grilled",
  "baked",
  "steamed",
  "raw",
  "other",
] as const;
export type CookingMethod = (typeof COOKING_METHODS)[number];

export const CALORIES_SOURCES = ["menu", "ai_estimate"] as const;
export type CaloriesSource = (typeof CALORIES_SOURCES)[number];

export const SEARCH_MODES = ["ai", "keyword", "fallback"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];
