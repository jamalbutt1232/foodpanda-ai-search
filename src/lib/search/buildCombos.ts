import type { DealDoc, MenuItemDoc, RestaurantDoc } from "@/lib/db";
import type { ComboLine } from "@/types/search";

/** Dishes that make a meal; sides/desserts still count toward servings, drinks don't. */
export const MAIN_CATEGORIES = new Set([
  "burger", "sandwich", "wrap", "pizza", "desi", "bbq", "chinese",
  "platter", "bowl", "salad", "wings",
]); // prettier-ignore
const NON_FOOD_CATEGORIES = new Set(["drink"]);

export const MAX_COMBOS = 50;
const BEAM_WIDTH = 200;
const MAX_OFFERS_PER_RESTAURANT = 24;
const MAX_RESULTS_PER_RESTAURANT = 300;
/** After a combo is valid, up to this many sides/drinks/desserts may be added on top. */
const MAX_EXTRAS = 3;
const EXTRAS_BEAM_WIDTH = 120;

export interface ComboSource {
  restaurant: RestaurantDoc;
  items: MenuItemDoc[];
  deals: { deal: DealDoc; lines: { item: MenuItemDoc; quantity: number }[] }[];
}

export interface ComboRequest {
  budget: number | null;
  partySize: number;
  requiredCategories: string[];
  preferCheapest: boolean;
}

interface Offer {
  name: string;
  unitPrice: number;
  servings: number;
  mains: number;
  /** Main servings whose category the user asked for. */
  requestedMains: number;
  categories: string[];
  details?: string;
  /** Price of the same contents at menu prices (deals only; equals unitPrice for items). */
  menuValue: number;
}

export interface BuiltCombo {
  id: string;
  restaurant: RestaurantDoc;
  lines: ComboLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  perPerson: number;
  servings: number;
  mains: number;
  savings: number;
  categories: string[];
  score: number;
}

function dealOffer({ deal, lines }: ComboSource["deals"][number], req: ComboRequest): Offer {
  const mainLines = lines.filter((l) => MAIN_CATEGORIES.has(l.item.category));
  const hasRequestedMain = mainLines.some((l) => req.requiredCategories.includes(l.item.category));
  return {
    name: deal.name,
    unitPrice: deal.price,
    servings: deal.servesPeople,
    mains: mainLines.length > 0 ? deal.servesPeople : 0,
    requestedMains: hasRequestedMain ? deal.servesPeople : 0,
    categories: [...new Set(lines.map((l) => l.item.category))],
    details: lines.map((l) => `${l.quantity}× ${l.item.name}`).join(" + "),
    menuValue: lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0),
  };
}

function itemOffer(item: MenuItemDoc, req: ComboRequest): Offer {
  const isFood = !NON_FOOD_CATEGORIES.has(item.category);
  const isMain = MAIN_CATEGORIES.has(item.category);
  return {
    name: item.name,
    unitPrice: item.price,
    servings: isFood ? item.servesPeople : 0,
    mains: isMain ? item.servesPeople : 0,
    requestedMains:
      isMain && req.requiredCategories.includes(item.category) ? item.servesPeople : 0,
    categories: [item.category],
    menuValue: item.price,
  };
}

/** Keeps the search small: all deals, plus the cheapest few items per category. */
function offersFor(source: ComboSource, req: ComboRequest): Offer[] {
  const byCategory = new Map<string, MenuItemDoc[]>();
  for (const item of source.items) {
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
  }
  const picked: MenuItemDoc[] = [];
  for (const [category, items] of byCategory) {
    const sorted = [...items].sort((a, b) => a.price - b.price);
    let keep = 2;
    if (req.requiredCategories.includes(category)) keep = 4;
    else if (NON_FOOD_CATEGORIES.has(category)) continue; // no unrequested drinks
    const sharing = sorted.filter((i) => i.servesPeople > 1).slice(0, 1);
    picked.push(...new Set([...sorted.slice(0, keep), ...sharing]));
  }
  return [
    ...source.deals.map((d) => dealOffer(d, req)),
    ...picked.map((i) => itemOffer(i, req)),
  ].slice(0, MAX_OFFERS_PER_RESTAURANT);
}

type State = {
  counts: number[];
  total: number;
  servings: number;
  mains: number;
  requestedMains: number;
};

function coveredCategories(counts: number[], offers: Offer[]): Set<string> {
  const covered = new Set<string>();
  counts.forEach((qty, i) => qty > 0 && offers[i].categories.forEach((c) => covered.add(c)));
  return covered;
}

/**
 * Valid = within budget (checked during search), every required category
 * covered, and everyone fed. "Fed" means a main dish per person when the order
 * includes mains; sides and desserts are extras, drinks never count.
 */
function isValid(state: State, offers: Offer[], req: ComboRequest, needsMain: boolean): boolean {
  if (state.servings < req.partySize) return false;
  if (needsMain && state.mains < req.partySize) return false;
  const covered = coveredCategories(state.counts, offers);
  return req.requiredCategories.every((c) => covered.has(c));
}

/** Bounded beam search over quantities of offers for one restaurant. */
function searchRestaurant(
  source: ComboSource,
  req: ComboRequest,
): { states: State[]; offers: Offer[] } {
  const offers = offersFor(source, req);
  const fee = source.restaurant.deliveryFee;
  const cap = req.budget === null ? Infinity : req.budget - fee;
  const costRef = Number.isFinite(cap) ? cap : req.partySize * 1000;
  // Only an order made purely of sides/desserts (e.g. "desserts for 6") skips the main-dish rule.
  const needsMain = !(
    req.requiredCategories.length > 0 &&
    req.requiredCategories.every((c) => !MAIN_CATEGORIES.has(c) && !NON_FOOD_CATEGORIES.has(c))
  );
  const maxUnits = Math.min(18, req.partySize + req.requiredCategories.length + 2 + MAX_EXTRAS);

  const heuristic = (s: State) => {
    const covered = coveredCategories(s.counts, offers);
    const coverage = req.requiredCategories.length
      ? req.requiredCategories.filter((c) => covered.has(c)).length / req.requiredCategories.length
      : 1;
    const fed = needsMain ? s.mains : s.servings;
    return Math.min(fed, req.partySize) / req.partySize + coverage - s.total / costRef;
  };

  const results = new Map<string, State>();
  let frontier: State[] = [
    {
      counts: offers.map(() => 0),
      total: 0,
      servings: 0,
      mains: 0,
      requestedMains: 0,
    },
  ];

  let extrasFrontier: (State & { extras: number })[] = [];

  for (let depth = 0; depth < maxUnits && frontier.length + extrasFrontier.length > 0; depth++) {
    const next = new Map<string, State>();
    const nextExtras = new Map<string, State & { extras: number }>();

    // Valid combos may take a few extras (fries, naan, drinks, dessert) within budget.
    for (const state of extrasFrontier) {
      if (state.extras >= MAX_EXTRAS) continue;
      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
        if (offer.mains > 0 || state.counts[i] >= req.partySize) continue;
        const total = state.total + offer.unitPrice;
        if (total > cap) continue;
        const counts = [...state.counts];
        counts[i] += 1;
        const key = counts.join(",");
        const child = {
          ...state,
          counts,
          total,
          servings: state.servings + offer.servings,
          extras: state.extras + 1,
        };
        results.set(key, child);
        nextExtras.set(key, child);
      }
    }

    for (const state of frontier) {
      // Any order of additions; the counts-based key dedupes permutations.
      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
        if (state.counts[i] >= req.partySize) continue;
        const total = state.total + offer.unitPrice;
        if (total > cap) continue;
        const counts = [...state.counts];
        counts[i] += 1;
        const child: State = {
          counts,
          total,
          servings: state.servings + offer.servings,
          mains: state.mains + offer.mains,
          requestedMains: state.requestedMains + offer.requestedMains,
        };
        const key = counts.join(",");
        if (isValid(child, offers, req, needsMain)) {
          results.set(key, child);
          nextExtras.set(key, { ...child, extras: 0 });
        } else {
          next.set(key, child);
        }
      }
    }
    frontier = [...next.values()].sort((a, b) => heuristic(b) - heuristic(a)).slice(0, BEAM_WIDTH);
    extrasFrontier = [...nextExtras.values()]
      .sort((a, b) => a.total - b.total)
      .slice(0, EXTRAS_BEAM_WIDTH);
  }
  // Search every depth (cheap combos are often the deeper ones), then keep the cheapest.
  const states = [...results.values()]
    .sort((a, b) => a.total - b.total)
    .slice(0, MAX_RESULTS_PER_RESTAURANT);
  return { states, offers };
}

function toCombo(source: ComboSource, offers: Offer[], state: State, req: ComboRequest) {
  const lines: ComboLine[] = [];
  let savings = 0;
  state.counts.forEach((quantity, i) => {
    if (quantity === 0) return;
    const offer = offers[i];
    lines.push({
      name: offer.name,
      quantity,
      unitPrice: offer.unitPrice,
      lineTotal: offer.unitPrice * quantity,
      ...(offer.details ? { details: offer.details } : {}),
    });
    savings += Math.max(0, offer.menuValue - offer.unitPrice) * quantity;
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const deliveryFee = source.restaurant.deliveryFee;
  const total = subtotal + deliveryFee;
  return {
    restaurant: source.restaurant,
    lines,
    subtotal,
    deliveryFee,
    total,
    perPerson: Math.ceil(total / req.partySize),
    servings: state.servings,
    mains: state.mains,
    requestedMains: state.requestedMains,
    savings,
    categories: [...coveredCategories(state.counts, offers)],
  };
}

/**
 * Builds valid single-restaurant combos: within budget (incl. delivery fee),
 * covering every required category, a main per person. Scored by value,
 * deal savings, variety, rating and fit to what was asked; "cheapest" requests
 * weigh price above all.
 */
export function buildCombos(sources: ComboSource[], req: ComboRequest): BuiltCombo[] {
  const raw = sources.flatMap((source) => {
    const { states, offers } = searchRestaurant(source, req);
    return states.map((state) => toCombo(source, offers, state, req));
  });
  if (raw.length === 0) return [];

  const valueOf = (c: (typeof raw)[number]) => Math.min(c.servings, req.partySize * 1.5) / c.total;
  const maxValue = Math.max(...raw.map(valueOf));
  const minTotal = Math.min(...raw.map((c) => c.total));
  const maxSavingsRatio = Math.max(...raw.map((c) => c.savings / c.total));

  const scored = raw.map((c) => {
    const value = valueOf(c) / maxValue;
    const mainsRatio = Math.min(1, c.mains / req.partySize);
    // Asked for burgers? Prefer combos where the mains actually are burgers.
    const requestedMainCats = req.requiredCategories.filter((cat) => MAIN_CATEGORIES.has(cat));
    const focus = requestedMainCats.length ? Math.min(1, c.requestedMains / req.partySize) : 1;
    const rating = c.restaurant.rating / 5;
    const cheap = minTotal / c.total;
    const overfed = c.servings > req.partySize * 2 ? 0.1 : 0;
    const savings = maxSavingsRatio > 0 ? c.savings / c.total / maxSavingsRatio : 0;
    const variety = Math.min(1, c.categories.length / 3);
    // Six of the exact same item reads as lazy; deals are exempt (they're curated).
    const monotony = c.lines.some((l) => !l.details && l.quantity >= Math.max(4, req.partySize))
      ? 0.08
      : 0;
    const penalty = overfed + monotony;
    const score = req.preferCheapest
      ? 0.45 * cheap + 0.15 * mainsRatio + 0.15 * focus + 0.1 * value + 0.15 * rating - overfed
      : 0.2 * value +
        0.2 * savings +
        0.15 * variety +
        0.15 * rating +
        0.15 * focus +
        0.1 * mainsRatio +
        0.05 * cheap -
        penalty;
    return { ...c, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.total - b.total)
    .slice(0, MAX_COMBOS)
    .map((c, i) => ({ ...c, id: `c${i + 1}` }));
}

/** Top N with at most `perRestaurant` from any one restaurant, keeping score order. */
export function diversify(combos: BuiltCombo[], n: number, perRestaurant = 4): BuiltCombo[] {
  const counts = new Map<string, number>();
  const picked: BuiltCombo[] = [];
  for (const combo of combos) {
    const used = counts.get(combo.restaurant._id) ?? 0;
    if (used >= perRestaurant) continue;
    counts.set(combo.restaurant._id, used + 1);
    picked.push(combo);
    if (picked.length === n) break;
  }
  return picked;
}
