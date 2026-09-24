import { describe, expect, it } from "vitest";
import type { DealDoc, MenuItemDoc } from "@/lib/db";
import { toDealDTO } from "@/lib/data/mappers";
import { formatPkr } from "@/lib/format/formatPkr";

const item = (id: string, name: string, price: number): MenuItemDoc => ({
  _id: id,
  restaurantId: "r01",
  name,
  description: "",
  category: "burger",
  price,
  ingredients: [],
  cookingMethod: "fried",
  calories: 500,
  caloriesSource: "menu",
  proteinGrams: 20,
  servesPeople: 1,
  dietaryTags: [],
  isAvailable: true,
});

const deal = (price: number, items: DealDoc["items"]): DealDoc => ({
  _id: "d001",
  restaurantId: "r01",
  name: "Test deal",
  description: "",
  price,
  servesPeople: 2,
  isAvailable: true,
  items,
});

const menu = new Map([
  ["m1", item("m1", "Zinger", 700)],
  ["m2", item("m2", "Fries", 270)],
]);

describe("toDealDTO", () => {
  it("resolves lines and computes menu value and savings in code", () => {
    const dto = toDealDTO(
      deal(1500, [
        { menuItemId: "m1", quantity: 2 },
        { menuItemId: "m2", quantity: 1 },
      ]),
      menu,
    );
    expect(dto.lines).toEqual([
      { menuItemId: "m1", name: "Zinger", quantity: 2, unitPrice: 700 },
      { menuItemId: "m2", name: "Fries", quantity: 1, unitPrice: 270 },
    ]);
    expect(dto.menuValue).toBe(1670);
    expect(dto.savings).toBe(170);
  });

  it("never reports negative savings", () => {
    expect(toDealDTO(deal(999, [{ menuItemId: "m2", quantity: 1 }]), menu).savings).toBe(0);
  });

  it("drops lines that reference unknown items instead of inventing them", () => {
    const dto = toDealDTO(deal(700, [{ menuItemId: "missing", quantity: 1 }]), menu);
    expect(dto.lines).toEqual([]);
    expect(dto.menuValue).toBe(0);
  });
});

describe("formatPkr", () => {
  it("formats as Rs. with thousands separators", () => {
    expect(formatPkr(1250)).toBe("Rs. 1,250");
    expect(formatPkr(300)).toBe("Rs. 300");
    expect(formatPkr(125000)).toBe("Rs. 125,000");
  });
});
