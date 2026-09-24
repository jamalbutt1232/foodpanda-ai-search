import { constraintsSchema, type Constraints } from "@/lib/ai/schemas";
import type { DealDoc, MenuItemDoc, RestaurantDoc } from "@/lib/db";

export function restaurant(id: string, overrides: Partial<RestaurantDoc> = {}): RestaurantDoc {
  return {
    _id: id,
    name: `Restaurant ${id}`,
    slug: `restaurant-${id}`,
    areaId: "gulberg",
    cuisine: "Fast Food",
    rating: 4.2,
    deliveryTimeMin: 30,
    deliveryFee: 100,
    isOpen: true,
    ...overrides,
  };
}

let itemSeq = 0;
export function item(overrides: Partial<MenuItemDoc> = {}): MenuItemDoc {
  itemSeq += 1;
  return {
    _id: `m${itemSeq}`,
    restaurantId: "r1",
    name: `Item ${itemSeq}`,
    description: "",
    category: "burger",
    price: 500,
    ingredients: [],
    cookingMethod: "grilled",
    calories: 400,
    caloriesSource: "menu",
    proteinGrams: 20,
    servesPeople: 1,
    dietaryTags: [],
    isAvailable: true,
    ...overrides,
  };
}

export function deal(overrides: Partial<DealDoc> = {}): DealDoc {
  return {
    _id: "d1",
    restaurantId: "r1",
    name: "Deal",
    description: "",
    price: 1000,
    servesPeople: 2,
    isAvailable: true,
    items: [],
    ...overrides,
  };
}

/** Constraints with schema defaults, like a parsed LLM response. */
export function constraints(partial: Partial<Constraints> = {}): Constraints {
  return constraintsSchema.parse({ intent: "single_dish", ...partial });
}
