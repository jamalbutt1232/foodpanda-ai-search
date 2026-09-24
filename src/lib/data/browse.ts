import { Area, connectDb, Deal, MenuItem, Restaurant, type MenuItemDoc } from "@/lib/db";
import { toAreaDTO, toDealDTO, toRestaurantDTO } from "@/lib/data/mappers";
import { categoryLabel, compareCategories } from "@/lib/format/labels";
import type { AreaBrowseDTO, AreaDealDTO, RestaurantSummaryDTO } from "@/types/restaurant";

export const DEFAULT_AREA_SLUG = "gulberg";
const TOP_DEALS_LIMIT = 8;
const NON_MEAL_CATEGORIES = new Set(["drink"]);

/** "Desi & BBQ" already says "Desi"/"BBQ"; "Burgers & Fast Food" already says "Burgers". */
function cuisineMentions(cuisine: string, label: string): boolean {
  const words = cuisine.toLowerCase().split(/[^a-z]+/);
  const stem = label.toLowerCase().replace(/e?s$/, "");
  return words.some((word) => word.replace(/e?s$/, "") === stem);
}

/**
 * Everything the home page needs for one area. Unknown slugs fall back to the
 * default area so a bad ?area= link still shows something useful.
 */
export async function getAreaBrowse(areaSlug: string | undefined): Promise<AreaBrowseDTO> {
  await connectDb();

  const area =
    (areaSlug ? await Area.findById(areaSlug).lean() : null) ??
    (await Area.findById(DEFAULT_AREA_SLUG).lean());
  if (!area) throw new Error(`Default area "${DEFAULT_AREA_SLUG}" is missing. Run npm run seed.`);

  const restaurants = await Restaurant.find({ areaId: area._id }).lean();
  const restaurantIds = restaurants.map((r) => r._id);
  const [items, deals] = await Promise.all([
    MenuItem.find({ restaurantId: { $in: restaurantIds } }).lean(),
    Deal.find({ restaurantId: { $in: restaurantIds }, isAvailable: true }).lean(),
  ]);

  const itemsByRestaurant = new Map<string, MenuItemDoc[]>();
  for (const item of items) {
    itemsByRestaurant.set(item.restaurantId, [
      ...(itemsByRestaurant.get(item.restaurantId) ?? []),
      item,
    ]);
  }
  const dealCounts = new Map<string, number>();
  for (const deal of deals) {
    dealCounts.set(deal.restaurantId, (dealCounts.get(deal.restaurantId) ?? 0) + 1);
  }

  const summaries: RestaurantSummaryDTO[] = restaurants.map((restaurant) => {
    const available = (itemsByRestaurant.get(restaurant._id) ?? []).filter((i) => i.isAvailable);
    const meals = available.filter((i) => !NON_MEAL_CATEGORIES.has(i.category));
    const categories = [...new Set(meals.map((i) => i.category))].sort(compareCategories);
    return {
      ...toRestaurantDTO(restaurant, area),
      availableItemCount: available.length,
      dealCount: dealCounts.get(restaurant._id) ?? 0,
      startingPrice: meals.length > 0 ? Math.min(...meals.map((i) => i.price)) : null,
      highlights: categories
        .map(categoryLabel)
        .filter((label) => !cuisineMentions(restaurant.cuisine, label))
        .slice(0, 3),
    };
  });
  // Open first, then best rated.
  summaries.sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || b.rating - a.rating);

  const itemsById = new Map(items.map((item) => [item._id, item]));
  const restaurantById = new Map(restaurants.map((r) => [r._id, r]));
  const topDeals: AreaDealDTO[] = deals
    .flatMap((deal) => {
      const owner = restaurantById.get(deal.restaurantId);
      if (!owner?.isOpen) return [];
      const dto = toDealDTO(deal, itemsById);
      return dto.lines.length > 0 ? [{ ...dto, restaurant: { name: owner.name, slug: owner.slug } }] : [];
    })
    .sort((a, b) => b.savings - a.savings || a.price - b.price)
    .slice(0, TOP_DEALS_LIMIT);

  return { area: toAreaDTO(area), restaurants: summaries, topDeals };
}
