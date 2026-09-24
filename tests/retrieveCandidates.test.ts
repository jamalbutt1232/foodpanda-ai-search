import { describe, expect, it } from "vitest";
import { keywordSearch } from "@/lib/search/keywordSearch";
import { normalizeConstraints } from "@/lib/search/normalize";
import {
  filterCandidates,
  filterDeals,
  MAX_CANDIDATES,
  passesHardFilters,
} from "@/lib/search/retrieveCandidates";
import { constraints, deal, item, restaurant } from "./fixtures";

const open = restaurant("r1", { name: "Burger Lab" });
const closed = restaurant("r2", { isOpen: false });

const sandwich = item({
  name: "Grilled Chicken Lettuce Sandwich",
  category: "sandwich",
  ingredients: ["chicken", "lettuce", "bread"],
  calories: 320,
  price: 600,
});
const beefBurger = item({ name: "Beef Burger", ingredients: ["beef", "bun"], calories: 800 });
const friedFries = item({
  name: "Fries",
  category: "fries",
  cookingMethod: "fried",
  calories: 350,
});
const airFries = item({
  name: "Air-Fried Fries",
  category: "fries",
  cookingMethod: "air_fried",
  calories: 210,
});
const unavailable = item({ name: "Sold Out Sandwich", category: "sandwich", isAvailable: false });
const cola = item({ name: "Cola", category: "drink" });

const menu = {
  restaurants: new Map([[open._id, open]]),
  items: [sandwich, beefBurger, friedFries, airFries, unavailable, cola],
};

const plan = (partial: Parameters<typeof constraints>[0], query = "test") =>
  normalizeConstraints(constraints(partial), query);

describe("passesHardFilters", () => {
  it("excludes ingredients by ingredient list and by name", () => {
    const c = constraints({ excludeIngredients: ["beef"] });
    expect(passesHardFilters(beefBurger, c)).toBe(false);
    expect(passesHardFilters(sandwich, c)).toBe(true);
  });

  it("enforces price cap, avoided methods and dietary tags", () => {
    expect(passesHardFilters(sandwich, constraints({ maxPricePerItem: 500 }))).toBe(false);
    expect(passesHardFilters(friedFries, constraints({ avoidCookingMethods: ["fried"] }))).toBe(
      false,
    );
    expect(passesHardFilters(sandwich, constraints({ dietaryTags: ["vegetarian"] }))).toBe(false);
  });
});

describe("filterCandidates", () => {
  it("returns exact matches first and never unavailable items", () => {
    const { candidates, exactCount } = filterCandidates(
      menu,
      plan({ dishTypes: ["sandwich"], includeIngredients: ["chicken"], targetCalories: 300 }),
    );
    expect(exactCount).toBe(1);
    expect(candidates[0].item.name).toBe("Grilled Chicken Lettuce Sandwich");
    expect(candidates.some((c) => c.item.name === "Sold Out Sandwich")).toBe(false);
  });

  it("loosens calories, then cooking method, then category when under 10", () => {
    const { relaxed, candidates } = filterCandidates(
      menu,
      plan({ dishTypes: ["fries"], cookingMethods: ["air_fried"], targetCalories: 200 }),
    );
    expect(relaxed).toEqual(["calories", "cookingMethod", "category"]);
    // Air-fried stays ahead of fried after loosening.
    const names = candidates.map((c) => c.item.name);
    expect(names.indexOf("Air-Fried Fries")).toBeLessThan(names.indexOf("Fries"));
  });

  it("never loosens hard filters", () => {
    const { candidates } = filterCandidates(menu, plan({ excludeIngredients: ["beef"] }));
    expect(candidates.some((c) => c.item.name === "Beef Burger")).toBe(false);
  });

  it("skips drinks unless asked, and items from closed restaurants", () => {
    const withClosed = {
      restaurants: new Map([[open._id, open]]),
      items: [...menu.items, item({ restaurantId: closed._id, name: "Closed Burger" })],
    };
    const names = filterCandidates(withClosed, plan({})).candidates.map((c) => c.item.name);
    expect(names).not.toContain("Cola");
    expect(names).not.toContain("Closed Burger");
  });

  it("caps candidates at 60", () => {
    const many = Array.from({ length: 80 }, () => item({ category: "burger" }));
    const { candidates } = filterCandidates(
      { restaurants: menu.restaurants, items: many },
      plan({ dishTypes: ["burger"] }),
    );
    expect(candidates).toHaveLength(MAX_CANDIDATES);
  });
});

describe("filterDeals", () => {
  it("drops deals containing an excluded ingredient", () => {
    const beefDeal = deal({ _id: "d1", items: [{ menuItemId: beefBurger._id, quantity: 2 }] });
    const okDeal = deal({ _id: "d2", items: [{ menuItemId: sandwich._id, quantity: 2 }] });
    const deals = filterDeals(
      {
        deals: [beefDeal, okDeal],
        restaurants: menu.restaurants,
        itemsById: new Map(menu.items.map((i) => [i._id, i])),
      },
      constraints({ excludeIngredients: ["beef"] }),
    );
    expect(deals.map((d) => d._id)).toEqual(["d2"]);
  });
});

describe("keywordSearch", () => {
  it("matches the whole phrase in names, descriptions or restaurant name only", () => {
    expect(keywordSearch(menu, "air-fried fries").map((c) => c.item.name)).toEqual([
      "Air-Fried Fries",
    ]);
    expect(keywordSearch(menu, "air fried fries")).toEqual([]);
    expect(keywordSearch(menu, "burger lab").length).toBeGreaterThan(0);
    expect(keywordSearch(menu, "healthy dinner")).toEqual([]);
  });
});
