import type { CaloriesSource, CookingMethod } from "@/lib/db/enums";

/** Plain, serializable shapes returned by the API and passed to components. */

export interface AreaDTO {
  id: string;
  name: string;
  slug: string;
  city: string;
}

export interface RestaurantDTO {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  rating: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  isOpen: boolean;
  area: AreaDTO;
}

export interface MenuItemDTO {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  ingredients: string[];
  cookingMethod: CookingMethod;
  calories: number;
  caloriesSource: CaloriesSource;
  proteinGrams: number | null;
  servesPeople: number;
  dietaryTags: string[];
  isAvailable: boolean;
}

export interface DealLineDTO {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface DealDTO {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  servesPeople: number;
  isAvailable: boolean;
  lines: DealLineDTO[];
  /** Sum of the lines at menu prices (computed in code). */
  menuValue: number;
  /** menuValue - price, never negative. */
  savings: number;
}

export interface RestaurantDetailDTO extends RestaurantDTO {
  deals: DealDTO[];
  menu: MenuItemDTO[];
}

/** Card-level summary for browsing an area. */
export interface RestaurantSummaryDTO extends RestaurantDTO {
  availableItemCount: number;
  dealCount: number;
  /** Biggest saving any one deal gives vs. menu prices (computed in code). */
  maxDealSavings: number;
  /** Menu categories with available dishes, e.g. ["burger", "fries"]. */
  categories: string[];
  /** Cheapest available non-drink item, if any. */
  startingPrice: number | null;
  /** Up to 3 category labels, e.g. ["Burgers", "Fries", "Desserts"]. */
  highlights: string[];
}

export interface AreaDealDTO extends DealDTO {
  restaurant: { name: string; slug: string };
}

export interface AreaBrowseDTO {
  area: AreaDTO;
  restaurants: RestaurantSummaryDTO[];
  topDeals: AreaDealDTO[];
}
