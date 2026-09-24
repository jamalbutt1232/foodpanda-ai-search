import type { AreaDoc, DealDoc, MenuItemDoc, RestaurantDoc } from "@/lib/db";
import type {
  AreaDTO,
  DealDTO,
  DealLineDTO,
  MenuItemDTO,
  RestaurantDTO,
} from "@/types/restaurant";

export function toAreaDTO(area: AreaDoc): AreaDTO {
  return { id: area._id, name: area.name, slug: area.slug, city: area.city };
}

export function toRestaurantDTO(restaurant: RestaurantDoc, area: AreaDoc): RestaurantDTO {
  return {
    id: restaurant._id,
    name: restaurant.name,
    slug: restaurant.slug,
    cuisine: restaurant.cuisine,
    rating: restaurant.rating,
    deliveryTimeMin: restaurant.deliveryTimeMin,
    deliveryFee: restaurant.deliveryFee,
    isOpen: restaurant.isOpen,
    area: toAreaDTO(area),
  };
}

export function toMenuItemDTO(item: MenuItemDoc): MenuItemDTO {
  return {
    id: item._id,
    restaurantId: item.restaurantId,
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price,
    ingredients: [...item.ingredients],
    cookingMethod: item.cookingMethod,
    calories: item.calories,
    caloriesSource: item.caloriesSource,
    proteinGrams: item.proteinGrams ?? null,
    servesPeople: item.servesPeople,
    dietaryTags: [...item.dietaryTags],
    isAvailable: item.isAvailable,
  };
}

/**
 * Resolves deal lines against the restaurant's menu. Lines pointing at unknown
 * items are dropped rather than shown with made-up names or prices.
 */
export function toDealDTO(deal: DealDoc, itemsById: Map<string, MenuItemDoc>): DealDTO {
  const lines: DealLineDTO[] = deal.items.flatMap((line) => {
    const item = itemsById.get(line.menuItemId);
    if (!item) return [];
    return [
      { menuItemId: item._id, name: item.name, quantity: line.quantity, unitPrice: item.price },
    ];
  });
  const menuValue = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return {
    id: deal._id,
    restaurantId: deal.restaurantId,
    name: deal.name,
    description: deal.description,
    price: deal.price,
    servesPeople: deal.servesPeople,
    isAvailable: deal.isAvailable,
    lines,
    menuValue,
    savings: Math.max(0, menuValue - deal.price),
  };
}
