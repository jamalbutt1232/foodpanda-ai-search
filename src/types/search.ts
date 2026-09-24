import type { Constraints } from "@/lib/ai/schemas";
import type { MenuItemDTO } from "@/types/restaurant";

export const SEARCH_REQUEST_MODES = ["ai", "keyword"] as const;
export type SearchRequestMode = (typeof SEARCH_REQUEST_MODES)[number];

export interface SearchRequest {
  query: string;
  areaSlug: string;
  mode: SearchRequestMode;
}

/** Restaurant fields a result card needs. */
export interface ResultRestaurant {
  id: string;
  name: string;
  slug: string;
  rating: number;
  deliveryTimeMin: number;
  deliveryFee: number;
}

export interface ItemResult {
  item: MenuItemDTO;
  restaurant: ResultRestaurant;
  /** 0-100 from the AI ranker; null for keyword results. */
  matchScore: number | null;
  reason: string | null;
}

export interface ComboLine {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** For deals: what's inside, e.g. "4× Club Sandwich + 4× Masala Fries". */
  details?: string;
}

export interface ComboResult {
  restaurant: ResultRestaurant;
  lines: ComboLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  perPerson: number;
  partySize: number;
  /** People fed, counting food only (drinks excluded). */
  servings: number;
  /** Deal savings vs. ordering the same items at menu price. */
  savings: number;
  budget: number | null;
  withinBudget: boolean;
  reason: string;
}

export interface SearchResponse {
  mode: "ai" | "keyword" | "fallback";
  provider: string | null;
  fallbackUsed: boolean;
  latencyMs: number;
  cached: boolean;
  constraints: Constraints | null;
  type: "items" | "combos";
  items?: ItemResult[];
  combos?: ComboResult[];
  /** Friendly explanation when results are empty or constraints were relaxed. */
  notice?: string;
}
