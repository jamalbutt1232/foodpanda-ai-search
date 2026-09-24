import { getProvider, LLMError } from "@/lib/ai/provider";
import { sharedCache } from "@/lib/cache";
import { SearchLog } from "@/lib/db";
import { EnvValidationError } from "@/lib/env";
import { logger } from "@/lib/logger";
import { loadAreaMenu, type AreaMenu } from "@/lib/search/areaMenu";
import { groupSearch } from "@/lib/search/groupSearch";
import { keywordSearch } from "@/lib/search/keywordSearch";
import { normalizeConstraints } from "@/lib/search/normalize";
import { normalizeQuery } from "@/lib/search/normalizeQuery";
import { parseQuery } from "@/lib/search/parseQuery";
import { toComboResult, toItemResult } from "@/lib/search/present";
import { rankItems } from "@/lib/search/rankItems";
import { filterCandidates, type RelaxedFilter } from "@/lib/search/retrieveCandidates";
import type { SearchRequest, SearchResponse } from "@/types/search";

export { AreaNotFoundError } from "@/lib/search/areaMenu";

const CACHE_TTL_MS = 60 * 60 * 1000;
/** Bump when the pipeline changes so stale results aren't served from memory. */
const CACHE_VERSION = 9;
const cache = sharedCache<SearchResponse>("search", CACHE_TTL_MS);

const RELAXED_LABELS: Record<RelaxedFilter, string> = {
  calories: "calorie range",
  cookingMethod: "cooking method",
  category: "dish type",
};

type ResponseBody = Omit<SearchResponse, "latencyMs" | "cached">;

function keywordResponse(menu: AreaMenu, query: string): ResponseBody {
  return {
    mode: "keyword",
    provider: null,
    fallbackUsed: false,
    constraints: null,
    type: "items",
    items: keywordSearch(menu, query).map((c) => toItemResult(c)),
  };
}

async function aiResponse(menu: AreaMenu, query: string): Promise<ResponseBody> {
  const provider = await getProvider();
  const parsed = await parseQuery(provider, query);
  const plan = normalizeConstraints(parsed.constraints, query);
  const common = { mode: "ai" as const, provider: provider.name, fallbackUsed: false };

  if (plan.constraints.intent === "group_budget") {
    const pickStarted = performance.now();
    const group = await groupSearch(provider, query, menu, plan);
    logger.info("search.timing", {
      parseMs: parsed.ms,
      combosAndPickMs: Math.round(performance.now() - pickStarted),
      combos: group.combos.length,
    });
    return {
      ...common,
      constraints: plan.constraints,
      type: "combos",
      combos: group.combos.map((c) =>
        toComboResult(c, group.request.partySize, group.request.budget),
      ),
      ...(group.notice ? { notice: group.notice } : {}),
    };
  }

  const { candidates, relaxed, exactCount } = filterCandidates(menu, plan);
  const rankStarted = performance.now();
  const ranked = await rankItems(provider, query, plan.constraints, candidates);
  logger.info("search.timing", {
    parseMs: parsed.ms,
    rankMs: Math.round(performance.now() - rankStarted),
    candidates: candidates.length,
  });
  let notice: string | undefined;
  if (candidates.length === 0) {
    notice = "Nothing on the menus here matches all of that. Try loosening a requirement.";
  } else if (exactCount === 0 && relaxed.length > 0) {
    notice = `No exact matches, so we relaxed the ${relaxed.map((r) => RELAXED_LABELS[r]).join(" and ")}.`;
  }
  return {
    ...common,
    constraints: plan.constraints,
    type: "items",
    items: ranked.map((r) => toItemResult(r, r.matchScore, r.reason)),
    ...(notice ? { notice } : {}),
  };
}

function resultIds(response: ResponseBody): string[] {
  if (response.items) return response.items.map((r) => r.item.id);
  return (response.combos ?? []).map(
    (c) => `${c.restaurant.id}:${c.lines.map((l) => `${l.quantity}x${l.name}`).join("+")}`,
  );
}

function logSearch(req: SearchRequest, response: SearchResponse): void {
  SearchLog.create({
    query: req.query,
    areaId: req.areaSlug,
    constraints: response.constraints,
    resultIds: resultIds(response),
    mode: response.mode,
    provider: response.provider,
    latencyMs: response.latencyMs,
    fallbackUsed: response.fallbackUsed,
  }).catch((error: unknown) => logger.error("search.log_failed", { error: String(error) }));
}

/** Search entry point: cache → (AI pipeline | keyword) → fallback on LLM failure → log. */
export async function search(req: SearchRequest): Promise<SearchResponse> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  const cacheKey = `v${CACHE_VERSION}|${req.areaSlug}|${req.mode}|${normalizeQuery(req.query)}`;

  const hit = cache.get(cacheKey);
  if (hit) {
    const response = { ...hit, cached: true, latencyMs: elapsed() };
    logSearch(req, response);
    return response;
  }

  const menu = await loadAreaMenu(req.areaSlug);
  let partial: ResponseBody;
  if (req.mode === "keyword") {
    partial = keywordResponse(menu, req.query);
  } else {
    try {
      partial = await aiResponse(menu, req.query);
    } catch (error) {
      if (!(error instanceof LLMError) && !(error instanceof EnvValidationError)) throw error;
      logger.warn("search.fallback", {
        reason: error instanceof LLMError ? error.kind : "missing_llm_config",
        message: error.message,
      });
      partial = {
        ...keywordResponse(menu, req.query),
        mode: "fallback",
        fallbackUsed: true,
        notice: "AI unavailable, showing keyword results",
      };
    }
  }

  const response: SearchResponse = { ...partial, cached: false, latencyMs: elapsed() };
  if (!response.fallbackUsed) cache.set(cacheKey, response);
  logSearch(req, response);
  logger.info("search", {
    mode: response.mode,
    area: req.areaSlug,
    ms: response.latencyMs,
    results: response.items?.length ?? response.combos?.length ?? 0,
    query: req.query,
  });
  return response;
}
