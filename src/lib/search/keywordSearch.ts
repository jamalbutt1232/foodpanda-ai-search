import type { AreaMenu } from "@/lib/search/areaMenu";
import type { Candidate } from "@/lib/search/retrieveCandidates";

export const KEYWORD_LIMIT = 20;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * "Today's search": the whole query as a case-insensitive substring (ILIKE
 * '%query%') of item name, item description or restaurant name. Deliberately
 * naive: it is the baseline the AI search is compared against.
 */
export function keywordSearch(
  menu: Pick<AreaMenu, "items" | "restaurants">,
  query: string,
): Candidate[] {
  const phrase = query.trim().replace(/\s+/g, " ");
  if (!phrase) return [];
  const re = new RegExp(escapeRegex(phrase), "i");

  return menu.items
    .flatMap((item) => {
      const restaurant = menu.restaurants.get(item.restaurantId);
      if (!restaurant || !item.isAvailable) return [];
      const hit = re.test(item.name) || re.test(item.description) || re.test(restaurant.name);
      return hit ? [{ item, restaurant }] : [];
    })
    .sort((a, b) => b.restaurant.rating - a.restaurant.rating || a.item.price - b.item.price)
    .slice(0, KEYWORD_LIMIT);
}
