import { describe, expect, it } from "vitest";
import { buildCombos, diversify, type ComboSource } from "@/lib/search/buildCombos";
import { deal, item, restaurant } from "./fixtures";

const r1 = restaurant("r1", { deliveryFee: 100, rating: 4.5 });
const burger = item({ restaurantId: "r1", name: "Burger", category: "burger", price: 500 });
const fries = item({ restaurantId: "r1", name: "Fries", category: "fries", price: 200 });
const bucket = item({
  restaurantId: "r1",
  name: "Fries Bucket",
  category: "fries",
  price: 600,
  servesPeople: 4,
});
const drink = item({ restaurantId: "r1", name: "Cola", category: "drink", price: 100 });
const familyDeal = deal({
  _id: "d1",
  restaurantId: "r1",
  name: "Family Deal",
  price: 2000,
  servesPeople: 4,
  items: [
    { menuItemId: burger._id, quantity: 4 },
    { menuItemId: fries._id, quantity: 2 },
  ],
});

const source: ComboSource = {
  restaurant: r1,
  items: [burger, fries, bucket, drink],
  deals: [
    {
      deal: familyDeal,
      lines: [
        { item: burger, quantity: 4 },
        { item: fries, quantity: 2 },
      ],
    },
  ],
};

const req = {
  budget: 3000,
  partySize: 4,
  requiredCategories: ["burger", "fries"],
  preferCheapest: false,
};

describe("buildCombos", () => {
  it("never exceeds the budget, including the delivery fee", () => {
    const combos = buildCombos([source], req);
    expect(combos.length).toBeGreaterThan(0);
    for (const c of combos) {
      expect(c.total).toBe(c.subtotal + c.deliveryFee);
      expect(c.total).toBeLessThanOrEqual(3000);
    }
  });

  it("covers every required category and gives each person a main", () => {
    for (const c of buildCombos([source], req)) {
      expect(c.categories).toEqual(expect.arrayContaining(["burger", "fries"]));
      expect(c.mains).toBeGreaterThanOrEqual(4);
      expect(c.servings).toBeGreaterThanOrEqual(4);
    }
  });

  it("computes line totals, per-person cost and deal savings in code", () => {
    const withDeal = buildCombos([source], req).find((c) =>
      c.lines.some((l) => l.name === "Family Deal"),
    );
    expect(withDeal).toBeDefined();
    const dealLine = withDeal!.lines.find((l) => l.name === "Family Deal")!;
    expect(dealLine.lineTotal).toBe(dealLine.unitPrice * dealLine.quantity);
    expect(dealLine.details).toBe("4× Burger + 2× Fries");
    // Menu value 4×500 + 2×200 = 2400 vs deal 2000.
    expect(withDeal!.savings).toBe(400 * dealLine.quantity);
    expect(withDeal!.perPerson).toBe(Math.ceil(withDeal!.total / 4));
  });

  it("finds the true cheapest valid combo", () => {
    const cheapest = buildCombos([source], { ...req, preferCheapest: true }).sort(
      (a, b) => a.total - b.total,
    )[0];
    // Brute force: 4 burgers (2000) + 1 fries (200) + fee 100 = 2300; deal route = 2000 + 100 = 2100.
    expect(cheapest.total).toBe(2100);
  });

  it("returns nothing when the budget can't cover it", () => {
    expect(buildCombos([source], { ...req, budget: 2000 })).toEqual([]);
  });

  it("doesn't let drinks feed people or sneak in unrequested", () => {
    const combos = buildCombos([source], { ...req, budget: null, requiredCategories: ["drink"] });
    for (const c of combos) expect(c.mains).toBeGreaterThanOrEqual(4);
    const noDrinkAsked = buildCombos([source], req);
    for (const c of noDrinkAsked) expect(c.lines.some((l) => l.name === "Cola")).toBe(false);
  });

  it("ignores budget when none is given", () => {
    const combos = buildCombos([source], { ...req, budget: null });
    expect(combos.length).toBeGreaterThan(0);
  });
});

describe("diversify", () => {
  it("limits combos per restaurant", () => {
    const combos = buildCombos([source], req);
    expect(diversify(combos, 10, 2)).toHaveLength(Math.min(2, combos.length));
  });
});
