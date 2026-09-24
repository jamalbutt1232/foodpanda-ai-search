import type { Constraints } from "@/lib/ai/schemas";

const CONSTRAINTS_SHAPE = `{
  "intent": "single_dish" | "group_budget",
  "dishTypes": string[],            // e.g. ["sandwich"], ["burger","fries"]
  "includeIngredients": string[],   // e.g. ["chicken","lettuce"]
  "excludeIngredients": string[],   // e.g. ["beef"]
  "onlyIngredients": boolean,       // true only when the user says "only X and Y"
  "cookingMethods": ("fried"|"air_fried"|"grilled"|"baked"|"steamed"|"raw"|"other")[],
  "avoidCookingMethods": ("fried"|"air_fried"|"grilled"|"baked"|"steamed"|"raw"|"other")[],
  "targetCalories": number | null,  // "around 300 calories" -> 300
  "maxCalories": number | null,     // "under 500 calories" -> 500
  "maxPricePerItem": number | null, // single dish price cap in PKR
  "budget": number | null,          // total PKR for a group order
  "partySize": number | null,
  "requiredCategories": string[],   // group orders: categories that must be included
  "dietaryTags": string[],          // only: high_protein, vegetarian, low_carb, spicy
  "cuisine": string | null,         // e.g. "desi", "chinese", "italian"
  "notes": string                   // anything else, short
}`;

type Example = { query: string; output: Constraints };

const base: Constraints = {
  intent: "single_dish",
  dishTypes: [],
  includeIngredients: [],
  excludeIngredients: [],
  onlyIngredients: false,
  cookingMethods: [],
  avoidCookingMethods: [],
  targetCalories: null,
  maxCalories: null,
  maxPricePerItem: null,
  budget: null,
  partySize: null,
  requiredCategories: [],
  dietaryTags: [],
  cuisine: null,
  notes: "",
};

const EXAMPLES: Example[] = [
  {
    query: "chicken and lettuce sandwich around 300 calories",
    output: {
      ...base,
      dishTypes: ["sandwich"],
      includeIngredients: ["chicken", "lettuce"],
      targetCalories: 300,
    },
  },
  {
    query: "air fried fries",
    output: { ...base, dishTypes: ["fries"], cookingMethods: ["air_fried"] },
  },
  {
    query: "I have 3000 PKR, feed 6 people, must include burgers and chips",
    output: {
      ...base,
      intent: "group_budget",
      dishTypes: ["burger", "fries"],
      budget: 3000,
      partySize: 6,
      requiredCategories: ["burger", "fries"],
    },
  },
  {
    query: "high protein dinner under 1000 PKR, no beef",
    output: {
      ...base,
      excludeIngredients: ["beef"],
      maxPricePerItem: 1000,
      dietaryTags: ["high_protein"],
      notes: "dinner",
    },
  },
  {
    query: "spicy desi food for 2 under 2000",
    output: {
      ...base,
      intent: "group_budget",
      dishTypes: ["desi"],
      budget: 2000,
      partySize: 2,
      requiredCategories: ["desi"],
      dietaryTags: ["spicy"],
      cuisine: "desi",
    },
  },
];

export const PARSE_SYSTEM_PROMPT = `You convert food search queries from Pakistani users into JSON matching this schema. Use PKR. 'Chips' means fries. Return only JSON.

Schema:
${CONSTRAINTS_SHAPE}

Rules:
- Use "group_budget" when the user mentions a group/number of people or a total budget for several people; otherwise "single_dish".
- A price limit for one dish goes in maxPricePerItem, not budget.
- "not fried", "no fried food" -> avoidCookingMethods ["fried"]. "light" or "healthy" -> put "healthy" in notes.
- Use singular lowercase dish words ("burger", not "Burgers"). Leave fields empty or null when not mentioned.

Examples:
${EXAMPLES.map((e) => `Query: ${e.query}\nJSON: ${JSON.stringify(e.output)}`).join("\n\n")}`;

export function parseUserPrompt(query: string): string {
  return `Query: ${query}\nJSON:`;
}

export function parseRetryPrompt(query: string, error: string): string {
  return `${parseUserPrompt(query)}

Your previous answer was invalid: ${error}
Return corrected JSON that matches the schema exactly.`;
}

export const RANK_SYSTEM_PROMPT = `Rank these menu items for the user's request. Only use item IDs from the list. Reasons must cite real facts from the item data. Return only JSON: { results: [{ id, matchScore, reason }] }.

- Return at most 8 results, best first. matchScore is 0-100 (100 = perfect match).
- reason: max 20 words, specific and factual: cite calories, price, protein, cooking method or ingredients exactly as given in the item data. Never invent numbers. Write prices like "Rs. 1,250" and calories like "315 kcal".
- Prefer items that satisfy every stated constraint; penalise items that break one.`;

export const COMBO_SYSTEM_PROMPT = `Pick the 3 best meal combinations for this group. Only use combo IDs given. Return only JSON: { picks: [{ comboId, reason }] }.

- Prefer combos that feed everyone well, cover what they asked for, and give good value; variety across restaurants is a plus.
- Every combo gives each person a main dish; sides are shared extras.
- reason: max 25 words, specific: cite restaurant, what's included, total or per-person price exactly as given. Never invent numbers. Write prices like "Rs. 1,250".`;
