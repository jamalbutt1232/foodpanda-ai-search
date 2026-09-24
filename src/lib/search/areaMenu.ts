import {
  Area,
  connectDb,
  Deal,
  MenuItem,
  Restaurant,
  type AreaDoc,
  type DealDoc,
  type MenuItemDoc,
  type RestaurantDoc,
} from "@/lib/db";

/** Everything orderable right now in one area: open restaurants, available items and deals. */
export interface AreaMenu {
  area: AreaDoc;
  restaurants: Map<string, RestaurantDoc>;
  items: MenuItemDoc[];
  deals: DealDoc[];
  /** All items of those restaurants (incl. unavailable), for resolving deal lines. */
  itemsById: Map<string, MenuItemDoc>;
}

export class AreaNotFoundError extends Error {
  constructor(slug: string) {
    super(`Unknown area "${slug}"`);
    this.name = "AreaNotFoundError";
  }
}

export async function loadAreaMenu(areaSlug: string): Promise<AreaMenu> {
  await connectDb();
  const area = await Area.findById(areaSlug).lean();
  if (!area) throw new AreaNotFoundError(areaSlug);

  const restaurants = await Restaurant.find({ areaId: area._id, isOpen: true }).lean();
  const ids = restaurants.map((r) => r._id);
  const [allItems, deals] = await Promise.all([
    MenuItem.find({ restaurantId: { $in: ids } }).lean(),
    Deal.find({ restaurantId: { $in: ids }, isAvailable: true }).lean(),
  ]);

  return {
    area,
    restaurants: new Map(restaurants.map((r) => [r._id, r])),
    items: allItems.filter((item) => item.isAvailable),
    deals,
    itemsById: new Map(allItems.map((item) => [item._id, item])),
  };
}
