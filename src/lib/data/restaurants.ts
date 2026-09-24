import { z } from "zod";
import { Area, connectDb, Deal, MenuItem, Restaurant } from "@/lib/db";
import { toDealDTO, toMenuItemDTO, toRestaurantDTO } from "@/lib/data/mappers";
import type { RestaurantDetailDTO } from "@/types/restaurant";

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Invalid restaurant slug");

/** Restaurant with its full menu and deals, or null if the slug is unknown. */
export async function getRestaurantBySlug(slug: string): Promise<RestaurantDetailDTO | null> {
  await connectDb();

  const restaurant = await Restaurant.findOne({ slug }).lean();
  if (!restaurant) return null;

  const [area, items, deals] = await Promise.all([
    Area.findById(restaurant.areaId).lean(),
    MenuItem.find({ restaurantId: restaurant._id }).sort({ category: 1, price: 1 }).lean(),
    Deal.find({ restaurantId: restaurant._id }).sort({ servesPeople: 1, price: 1 }).lean(),
  ]);
  if (!area) {
    throw new Error(`Restaurant ${restaurant._id} references missing area ${restaurant.areaId}`);
  }

  const itemsById = new Map(items.map((item) => [item._id, item]));

  return {
    ...toRestaurantDTO(restaurant, area),
    menu: items.map(toMenuItemDTO),
    deals: deals.map((deal) => toDealDTO(deal, itemsById)),
  };
}
