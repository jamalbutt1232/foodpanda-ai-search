import type { LLMProvider } from "@/lib/ai/provider";
import type { MenuItemDoc } from "@/lib/db";
import { categoryLabel } from "@/lib/format/labels";
import { formatPkr } from "@/lib/format/formatPkr";
import type { AreaMenu } from "@/lib/search/areaMenu";
import {
  buildCombos,
  diversify,
  type ComboRequest,
  type ComboSource,
} from "@/lib/search/buildCombos";
import type { SearchPlan } from "@/lib/search/normalize";
import { COMBOS_TO_LLM, pickCombos, type PickedCombo } from "@/lib/search/pickCombos";
import { filterDeals, passesHardFilters } from "@/lib/search/retrieveCandidates";

/** Dietary needs every dish must meet; taste tags like "spicy" are left to the LLM's pick. */
const STRICT_GROUP_TAGS = new Set(["vegetarian"]);

/** Restaurants matching the requested cuisine, or all of them if none match. */
function restaurantsFor(menu: AreaMenu, cuisine: string | null) {
  const all = [...menu.restaurants.values()];
  if (!cuisine) return all;
  const matching = all.filter((r) => r.cuisine.toLowerCase().includes(cuisine));
  return matching.length > 0 ? matching : all;
}

/** Per-restaurant items and deals that respect the user's hard constraints. */
export function comboSources(menu: AreaMenu, plan: SearchPlan): ComboSource[] {
  const c = {
    ...plan.constraints,
    maxPricePerItem: null,
    dietaryTags: plan.constraints.dietaryTags.filter((t) => STRICT_GROUP_TAGS.has(t)),
  };
  const deals = filterDeals(menu, c);

  return restaurantsFor(menu, plan.constraints.cuisine).map((restaurant) => ({
    restaurant,
    items: menu.items.filter(
      (item) => item.restaurantId === restaurant._id && passesHardFilters(item, c),
    ),
    deals: deals
      .filter((deal) => deal.restaurantId === restaurant._id)
      .map((deal) => ({
        deal,
        lines: deal.items.flatMap((line) => {
          const item: MenuItemDoc | undefined = menu.itemsById.get(line.menuItemId);
          return item ? [{ item, quantity: line.quantity }] : [];
        }),
      })),
  }));
}

export function comboRequest(plan: SearchPlan): ComboRequest {
  return {
    budget: plan.constraints.budget,
    partySize: plan.constraints.partySize ?? 1,
    requiredCategories: plan.constraints.requiredCategories,
    preferCheapest: plan.preferCheapest,
  };
}

/** Explains an empty result with the cheapest real option, computed in code. */
function noComboNotice(sources: ComboSource[], req: ComboRequest): string {
  const what = req.requiredCategories.length
    ? req.requiredCategories.map(categoryLabel).join(" + ")
    : "a meal";
  const cheapest = buildCombos(sources, { ...req, budget: null, preferCheapest: true }).sort(
    (a, b) => a.total - b.total,
  )[0];
  const base = `No single restaurant here can serve ${what} for ${req.partySize} within ${
    req.budget !== null ? formatPkr(req.budget) : "your budget"
  }.`;
  return cheapest
    ? `${base} The cheapest option is ${formatPkr(cheapest.total)} at ${cheapest.restaurant.name}.`
    : `${base} Try another area or fewer requirements.`;
}

export interface GroupSearchResult {
  combos: PickedCombo[];
  request: ComboRequest;
  notice?: string;
  llmCalls: number;
}

export async function groupSearch(
  provider: LLMProvider,
  query: string,
  menu: AreaMenu,
  plan: SearchPlan,
): Promise<GroupSearchResult> {
  const request = comboRequest(plan);
  const sources = comboSources(menu, plan);
  const combos = buildCombos(sources, request);
  if (combos.length === 0) {
    return { combos: [], request, notice: noComboNotice(sources, request), llmCalls: 0 };
  }
  const shortlist = diversify(combos, COMBOS_TO_LLM);
  const picked = await pickCombos(provider, query, request, shortlist);
  if (request.preferCheapest) picked.sort((a, b) => a.total - b.total);
  return { combos: picked, request, llmCalls: 1 };
}
