import { RANK_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { COOKING_METHOD_LABELS } from "@/lib/format/labels";
import { LLMError, type LLMProvider } from "@/lib/ai/provider";
import { rankResponseSchema, type Constraints } from "@/lib/ai/schemas";
import type { Candidate } from "@/lib/search/retrieveCandidates";
import {
  factualItemReason,
  itemFacts,
  reasonNumbersAreFactual,
  truncateWords,
} from "@/lib/search/reasons";

export const TOP_ITEMS = 8;
const MAX_REASON_WORDS = 20;
const MAX_SAME_DISH = 2;

export interface RankedCandidate extends Candidate {
  matchScore: number;
  reason: string;
}

/** Compact payload: short keys, IDs as the only references. */
function toPromptItem({ item, restaurant }: Candidate) {
  return {
    id: item._id,
    name: item.name,
    restaurant: restaurant.name,
    category: item.category,
    desc: item.description,
    price: item.price,
    kcal: item.calories,
    protein_g: item.proteinGrams,
    method: COOKING_METHOD_LABELS[item.cookingMethod].toLowerCase(),
    ingredients: item.ingredients,
    tags: item.dietaryTags,
  };
}

export function buildRankPrompt(query: string, c: Constraints, candidates: Candidate[]): string {
  return JSON.stringify({
    request: query,
    constraints: c,
    items: candidates.map(toPromptItem),
  });
}

/**
 * Ranks candidates with the LLM. IDs not in the candidate list are dropped,
 * reasons with numbers that don't match the data are replaced by a factual one,
 * and the final order is matchScore then rating.
 */
export async function rankItems(
  provider: LLMProvider,
  query: string,
  constraints: Constraints,
  candidates: Candidate[],
): Promise<RankedCandidate[]> {
  if (candidates.length === 0) return [];

  const response = await provider.completeJSON({
    system: RANK_SYSTEM_PROMPT,
    user: buildRankPrompt(query, constraints, candidates),
    schema: rankResponseSchema,
  });

  const byId = new Map(candidates.map((c) => [c.item._id, c]));
  const seen = new Set<string>();
  const ranked: RankedCandidate[] = [];

  for (const result of response.results) {
    const candidate = byId.get(result.id);
    if (!candidate || seen.has(result.id)) continue; // hallucinated or duplicate ID
    seen.add(result.id);

    const reason = truncateWords(result.reason, MAX_REASON_WORDS);
    const facts = itemFacts(candidate.item, constraints, [candidate.restaurant.deliveryTimeMin]);
    ranked.push({
      ...candidate,
      matchScore: result.matchScore,
      reason:
        reason && reasonNumbersAreFactual(reason, facts)
          ? reason
          : factualItemReason(candidate.item, constraints),
    });
  }

  if (ranked.length === 0) {
    throw new LLMError("invalid_output", "Ranker returned no valid candidate IDs");
  }

  // Same dish at many restaurants (e.g. "Greek Yogurt Parfait") shouldn't fill the list.
  const perName = new Map<string, number>();
  return ranked
    .sort((a, b) => b.matchScore - a.matchScore || b.restaurant.rating - a.restaurant.rating)
    .filter(({ item }) => {
      const key = item.name.toLowerCase();
      const count = (perName.get(key) ?? 0) + 1;
      perName.set(key, count);
      return count <= MAX_SAME_DISH;
    })
    .slice(0, TOP_ITEMS);
}
