import { toMenuItemDTO } from "@/lib/data/mappers";
import type { RestaurantDoc } from "@/lib/db";
import type { PickedCombo } from "@/lib/search/pickCombos";
import type { Candidate } from "@/lib/search/retrieveCandidates";
import type { ComboResult, ItemResult, ResultRestaurant } from "@/types/search";

export function toResultRestaurant(r: RestaurantDoc): ResultRestaurant {
  return {
    id: r._id,
    name: r.name,
    slug: r.slug,
    rating: r.rating,
    deliveryTimeMin: r.deliveryTimeMin,
    deliveryFee: r.deliveryFee,
  };
}

export function toItemResult(
  { item, restaurant }: Candidate,
  matchScore: number | null = null,
  reason: string | null = null,
): ItemResult {
  return {
    item: toMenuItemDTO(item),
    restaurant: toResultRestaurant(restaurant),
    matchScore,
    reason,
  };
}

export function toComboResult(
  combo: PickedCombo,
  partySize: number,
  budget: number | null,
): ComboResult {
  return {
    restaurant: toResultRestaurant(combo.restaurant),
    lines: combo.lines,
    subtotal: combo.subtotal,
    deliveryFee: combo.deliveryFee,
    total: combo.total,
    perPerson: combo.perPerson,
    partySize,
    servings: combo.servings,
    savings: combo.savings,
    budget,
    withinBudget: budget === null || combo.total <= budget,
    reason: combo.reason,
  };
}
