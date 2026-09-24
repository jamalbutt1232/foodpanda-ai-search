import { describe, expect, it } from "vitest";
import { constraintsToChips } from "@/lib/format/understood";
import { constraints } from "./fixtures";

const labels = (partial: Parameters<typeof constraints>[0]) =>
  constraintsToChips(constraints(partial)).map((c) => c.label);

describe("constraintsToChips", () => {
  it("describes a single-dish query the way the pitch shows it", () => {
    expect(
      labels({
        dishTypes: ["sandwich"],
        includeIngredients: ["chicken", "lettuce"],
        targetCalories: 300,
        cookingMethods: ["grilled"],
      }),
    ).toEqual(["sandwich", "chicken", "lettuce", "grilled", "~300 kcal"]);
  });

  it("describes budgets, people, exclusions and avoided methods", () => {
    expect(
      labels({
        intent: "group_budget",
        budget: 4000,
        partySize: 4,
        excludeIngredients: ["beef"],
        avoidCookingMethods: ["fried"],
        dietaryTags: ["high_protein"],
      }),
    ).toEqual(["no beef", "not fried", "high protein", "budget Rs. 4,000", "4 people"]);
  });

  it("collapses the healthy cooking set into one chip", () => {
    expect(
      labels({ cookingMethods: ["grilled", "steamed", "raw", "air_fried"], maxCalories: 550 }),
    ).toEqual(["healthy cooking", "under 550 kcal"]);
  });

  it("shows required categories that aren't already dish types", () => {
    expect(
      labels({
        intent: "group_budget",
        dishTypes: ["burger"],
        requiredCategories: ["burger", "drink"],
      }),
    ).toEqual(["burger", "with drink"]);
  });
});
