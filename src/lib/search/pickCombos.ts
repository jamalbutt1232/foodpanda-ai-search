import { COMBO_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { LLMProvider } from "@/lib/ai/provider";
import { comboPickSchema } from "@/lib/ai/schemas";
import { categoryLabel } from "@/lib/format/labels";
import { formatPkr } from "@/lib/format/formatPkr";
import type { BuiltCombo, ComboRequest } from "@/lib/search/buildCombos";
import { reasonNumbersAreFactual, truncateWords } from "@/lib/search/reasons";

export const COMBOS_TO_LLM = 10;
export const COMBOS_TO_SHOW = 3;
const MAX_REASON_WORDS = 25;

export interface PickedCombo extends BuiltCombo {
  reason: string;
}

export function buildComboPrompt(query: string, req: ComboRequest, combos: BuiltCombo[]): string {
  return JSON.stringify({
    request: query,
    partySize: req.partySize,
    budget: req.budget,
    mustInclude: req.requiredCategories,
    combos: combos.map((c) => ({
      comboId: c.id,
      restaurant: c.restaurant.name,
      rating: c.restaurant.rating,
      items: c.lines.map((l) => `${l.quantity}× ${l.name}${l.details ? ` (${l.details})` : ""}`),
      feeds: c.servings,
      total: c.total,
      perPerson: c.perPerson,
      deliveryFee: c.deliveryFee,
      dealSavings: c.savings,
    })),
  });
}

function comboFacts(combo: BuiltCombo, req: ComboRequest): number[] {
  return [
    combo.total,
    combo.subtotal,
    combo.perPerson,
    combo.deliveryFee,
    combo.savings,
    combo.servings,
    combo.restaurant.rating,
    req.budget ?? 0,
    req.budget !== null ? req.budget - combo.total : 0,
    ...combo.lines.flatMap((l) => [l.unitPrice, l.lineTotal]),
  ].filter((n) => n > 0);
}

export function factualComboReason(combo: BuiltCombo, req: ComboRequest): string {
  const covers = combo.categories.map(categoryLabel).join(", ");
  const left =
    req.budget !== null && req.budget > combo.total
      ? `, ${formatPkr(req.budget - combo.total)} under budget`
      : "";
  return `Feeds ${combo.servings} with ${covers} from ${combo.restaurant.name}: ${formatPkr(combo.total)} total, ${formatPkr(combo.perPerson)} per person${left}.`;
}

/**
 * LLM picks the best 3 of the top combos and explains them. Unknown IDs are
 * ignored; if it returns fewer than 3 valid picks the rest are filled by score.
 */
export async function pickCombos(
  provider: LLMProvider,
  query: string,
  req: ComboRequest,
  combos: BuiltCombo[],
): Promise<PickedCombo[]> {
  if (combos.length === 0) return [];
  const shortlist = combos.slice(0, COMBOS_TO_LLM);

  const response = await provider.completeJSON({
    system: COMBO_SYSTEM_PROMPT,
    user: buildComboPrompt(query, req, shortlist),
    schema: comboPickSchema,
  });

  const byId = new Map(shortlist.map((c) => [c.id, c]));
  const picked: PickedCombo[] = [];
  for (const pick of response.picks) {
    const combo = byId.get(pick.comboId);
    if (!combo || picked.some((p) => p.id === combo.id)) continue;
    const reason = truncateWords(pick.reason, MAX_REASON_WORDS);
    picked.push({
      ...combo,
      reason:
        reason && reasonNumbersAreFactual(reason, comboFacts(combo, req))
          ? reason
          : factualComboReason(combo, req),
    });
    if (picked.length === COMBOS_TO_SHOW) break;
  }

  for (const combo of shortlist) {
    if (picked.length >= COMBOS_TO_SHOW) break;
    if (!picked.some((p) => p.id === combo.id)) {
      picked.push({ ...combo, reason: factualComboReason(combo, req) });
    }
  }
  return picked;
}
