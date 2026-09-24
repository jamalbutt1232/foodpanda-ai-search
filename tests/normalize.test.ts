import { describe, expect, it } from "vitest";
import { HEALTHY_MAX_CALORIES, normalizeConstraints, toCategory } from "@/lib/search/normalize";
import { constraints } from "./fixtures";

describe("toCategory", () => {
  it("maps synonyms and plurals to menu categories", () => {
    expect(toCategory("chips")).toBe("fries");
    expect(toCategory("Burgers")).toBe("burger");
    expect(toCategory("sandwiches")).toBe("sandwich");
    expect(toCategory("cold drink")).toBe("drink");
    expect(toCategory("shawarma")).toBe("wrap");
    expect(toCategory("biryani")).toBe("desi");
    expect(toCategory("spaceship")).toBeNull();
  });
});

describe("normalizeConstraints", () => {
  it("maps chips to fries in dish types and required categories", () => {
    const plan = normalizeConstraints(
      constraints({
        intent: "group_budget",
        dishTypes: ["burgers", "chips"],
        requiredCategories: ["burgers", "chips"],
        budget: 3000,
        partySize: 6,
      }),
      "3000 PKR for 6 people, burgers and chips",
    );
    expect(plan.constraints.dishTypes).toEqual(["burger", "fries"]);
    expect(plan.constraints.requiredCategories).toEqual(["burger", "fries"]);
    expect(plan.categories).toEqual(["burger", "fries"]);
  });

  it("applies the healthy rule: healthy cooking methods and calories < 550", () => {
    const plan = normalizeConstraints(constraints({}), "something healthy");
    expect(plan.healthy).toBe(true);
    expect(plan.constraints.cookingMethods).toEqual(["grilled", "steamed", "raw", "air_fried"]);
    expect(plan.constraints.maxCalories).toBe(HEALTHY_MAX_CALORIES);
  });

  it("keeps a stricter user calorie cap and respects avoided methods", () => {
    const plan = normalizeConstraints(
      constraints({ maxCalories: 400, avoidCookingMethods: ["raw"] }),
      "light lunch",
    );
    expect(plan.constraints.maxCalories).toBe(400);
    expect(plan.constraints.cookingMethods).not.toContain("raw");
  });

  it("treats a lone price limit as a per-item cap, not a group budget", () => {
    const plan = normalizeConstraints(
      constraints({ intent: "group_budget", budget: 1000, dietaryTags: ["high protein"] }),
      "high protein under 1000 PKR",
    );
    expect(plan.constraints.intent).toBe("single_dish");
    expect(plan.constraints.maxPricePerItem).toBe(1000);
    expect(plan.constraints.budget).toBeNull();
    expect(plan.constraints.dietaryTags).toEqual(["high_protein"]);
  });

  it("makes party size >= 2 a group order and requires a cuisine category", () => {
    const plan = normalizeConstraints(
      constraints({ partySize: 2, budget: 2000, cuisine: "desi", dietaryTags: ["spicy"] }),
      "spicy desi food for 2 under 2000",
    );
    expect(plan.constraints.intent).toBe("group_budget");
    expect(plan.constraints.requiredCategories).toEqual(["desi"]);
  });

  it("detects cheapest-first requests", () => {
    expect(
      normalizeConstraints(constraints({ partySize: 4 }), "cheapest meal for 4").preferCheapest,
    ).toBe(true);
    expect(normalizeConstraints(constraints({}), "tasty burger").preferCheapest).toBe(false);
  });

  it("never wants and avoids the same cooking method", () => {
    const plan = normalizeConstraints(
      constraints({ cookingMethods: ["fried", "grilled"], avoidCookingMethods: ["fried"] }),
      "grilled not fried",
    );
    expect(plan.constraints.cookingMethods).toEqual(["grilled"]);
  });

  it("drops generic words like 'meal' from dish types", () => {
    const plan = normalizeConstraints(
      constraints({ dishTypes: ["meal", "drinks"] }),
      "a meal with drinks",
    );
    expect(plan.constraints.dishTypes).toEqual(["drink"]);
  });
});
