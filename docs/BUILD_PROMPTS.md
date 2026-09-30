# Build prompts: AI menu search & recommendation engine

Copy-paste prompts for rebuilding the engine behind this project with an AI coding assistant
(Claude Code, Cursor, Copilot, etc.). The engine reads restaurant menus, understands a natural
request ("chicken sandwich around 300 calories", "dinner for 4 under Rs. 4,000") and returns
real dishes or complete meal combos, each with a factual reason.

## How to use

- Run the prompts **in order**, one per session or step. Each assumes the previous steps exist.
- Paste **Prompt 0** at the start of every new session so the assistant keeps the ground rules.
- After each step, run the tests and try a few queries before moving on.
- The rules marked **Lesson** come from bugs found while building this project. Keep them.
- Stack used here: Next.js + TypeScript, MongoDB/Mongoose, Zod, Google Gemini (Groq/Anthropic
  optional), Vitest. The prompts name it, but the design works with any stack: swap the names.

| #   | Prompt                 | Builds                                           |
| --- | ---------------------- | ------------------------------------------------ |
| 0   | Project brief          | Ground rules for every session                   |
| 1   | Data model & seed      | Menu data in a database                          |
| 2   | LLM provider wrapper   | One JSON-only interface over any LLM             |
| 3   | Query parsing          | Free text → structured constraints               |
| 4   | Normalization          | Synonyms, "healthy", intent fixes                |
| 5   | Candidate retrieval    | Database filtering with step-by-step loosening   |
| 6   | AI ranking             | Top dishes with fact-checked reasons             |
| 7   | Group & budget planner | Meal combos built in code                        |
| 8   | Combo picking          | LLM chooses and explains the best 3              |
| 9   | Keyword baseline       | "Today's search" for comparison                  |
| 10  | Search API             | Orchestration, cache, fallback, rate limit, logs |
| 11  | Tests & acceptance     | Unit tests and a demo-query checklist            |
| 12  | Search UI (optional)   | Results, "Understood as" chips, compare view     |

---

## Prompt 0: Project brief (paste at the start of every session)

```text
You are a senior TypeScript engineer. We are building an AI-powered food search engine.

What it does: a user in a delivery area types a natural-language request. The engine reads the
menus of open restaurants in that area and returns either the best-matching dishes or complete
single-restaurant meal combos for a group/budget, each with a short reason citing real menu facts.

Example requests:
- "chicken and lettuce sandwich around 300 calories"
- "air fried fries"
- "dinner for 4 people under Rs. 4,000"
- "high protein under Rs. 1,000, no beef"
- "something light and not fried"
- "cheapest meal for 4 with drinks"

Stack: Next.js (App Router) + TypeScript strict (no `any`), MongoDB + Mongoose, Zod for every API
input and every LLM output, Vitest. LLM: provider-agnostic wrapper, Google Gemini by default.

Non-negotiable rules:
1. The LLM never decides facts. IDs, prices, calories, totals, savings and per-person costs come
   from the database and are computed in code. Verify every ID the LLM returns against the list
   you sent it and drop unknown ones.
2. Never show a dish that isn't in the database, and never exceed a budget (including delivery fee).
3. At most 2 LLM calls per search: one to understand the query, one to rank or pick.
4. Every LLM call has a timeout (10 s) and a fallback. If the AI fails, return plain keyword
   results with a notice instead of an error.
5. Money is integer PKR, formatted "Rs. 1,250".
6. Keep files under ~300 lines; small, testable, pure functions for the logic.

Build only what the current prompt asks for. Ask before adding features.
```

---

## Prompt 1: Data model & seed

```text
Create the data layer.

Collections (Mongoose, string `_id`s taken from the seed file so LLM output can be checked by ID):
- Area: _id = slug ("gulberg"), name, slug (unique), city
- Restaurant: _id ("r01"), name, slug (unique), areaId, cuisine, rating (0–5),
  deliveryTimeMin, deliveryFee (int PKR), isOpen
- MenuItem: _id ("m0001"), restaurantId, name, description, category (e.g. burger, sandwich,
  fries, drink, dessert, desi, bbq...), price (int PKR), ingredients: string[],
  cookingMethod: fried | air_fried | grilled | baked | steamed | raw | other,
  calories (int), caloriesSource: menu | ai_estimate, proteinGrams (int | null),
  servesPeople (int >= 1), dietaryTags: string[] (high_protein, vegetarian, low_carb, spicy),
  isAvailable
- Deal: _id ("d001"), restaurantId, name, description, price, servesPeople, isAvailable,
  items: [{ menuItemId, quantity }]   (embed the lines in the deal)
- SearchLog: query, areaId, constraints (mixed), resultIds, mode (ai | keyword | fallback),
  provider, latencyMs, fallbackUsed, createdAt

Indexes: Restaurant(areaId, isOpen); MenuItem(restaurantId, category), category, price, calories;
Deal(restaurantId).

Seed script (`npm run seed`) reading data/seed.json with keys areas, restaurants (with areaSlug),
menuItems, deals, dealItems:
- Validate the whole file with Zod first.
- Check references and fail loudly on any problem: unknown area/restaurant/item, a deal line
  pointing at another restaurant's item, duplicate IDs or slugs.
- Idempotent: upsert every record by _id (bulkWrite replaceOne with upsert), then delete records
  no longer in the file. Never touch search logs.
- Print per-collection counts: in file / inserted / updated / removed. Running it twice must
  report 0 inserted and 0 updated.

Also add a cached connection helper that survives dev hot reloads, and a mapper that turns a
deal into { lines with name, quantity, unitPrice }, menuValue and savings = max(0, menuValue -
price), computed in code; drop lines whose item is missing instead of inventing them.
```

---

## Prompt 2: LLM provider wrapper

````text
Create src/lib/ai/provider.ts: one interface for every LLM.

interface LLMProvider {
  name: "gemini" | "groq" | "anthropic";
  completeJSON<T>(opts: { system: string; user: string; schema: ZodType<T>;
                          tier?: "fast" | "smart" }): Promise<T>;
}

Implementations: Gemini (@google/genai, responseMimeType "application/json"), Groq
(OpenAI-compatible SDK, response_format json_object), Anthropic (@anthropic-ai/sdk, JSON demanded
in the prompt). Selected by env LLM_PROVIDER.

Behaviour:
- temperature 0.2; 10 s timeout via AbortSignal; turn OFF all SDK auto-retries (Gemini defaults
  to several attempts, which silently blows the latency budget).
- Strip ```json fences and any prose around the outermost {...} before JSON.parse.
- Validate with the Zod schema; on failure throw LLMError("invalid_output") with the Zod issues
  in the message (the caller may retry once with that message).
- Classify every failure into LLMError kinds: timeout, rate_limit (429), unavailable (5xx),
  invalid_output, other.
- Three models from env with small, fast defaults: LLM_MODEL (ranking), LLM_FAST_MODEL (parsing),
  LLM_BACKUP_MODEL. On rate_limit or unavailable, retry exactly once on the backup model.
- For Gemini, request the lowest "thinking" level the model supports (these are short
  extraction/ranking tasks; thinking adds seconds).
- Validate env with Zod in two parts so the DB works without an LLM key: DB env
  (MONGODB_URI) and LLM env (only the selected provider's key is required; empty strings count
  as unset).

Lessons:
- Use small "lite/flash" models: accurate enough here, 1–3 s, far gentler on free quotas.
- Free-tier quotas are per model, so a backup model with its own quota keeps search alive.
- Check model availability with the real key before choosing defaults; older model names may
  be unavailable to new keys.
````

---

## Prompt 3: Query parsing

```text
Create the constraints schema (src/lib/ai/schemas.ts) and parseQuery.

Constraints (Zod). Be lenient with LLM quirks: default missing fields, coerce "300" → 300,
lowercase + dedupe string arrays, map "Air-Fried" → "air_fried", null out-of-range numbers
instead of failing:
{
  intent: "single_dish" | "group_budget",
  dishTypes: string[],             // ["sandwich"], ["burger","fries"]
  includeIngredients: string[],    // ["chicken","lettuce"]
  excludeIngredients: string[],    // ["beef"]
  onlyIngredients: boolean,        // "only X and Y"
  cookingMethods: CookingMethod[],
  avoidCookingMethods: CookingMethod[],   // "not fried"
  targetCalories: number | null,   // "around 300" → 300
  maxCalories: number | null,      // "under 500 calories"
  maxPricePerItem: number | null,  // single-dish price cap
  budget: number | null,           // total for a group
  partySize: number | null,
  requiredCategories: string[],    // group: must be in the order
  dietaryTags: string[],           // high_protein, vegetarian, low_carb, spicy
  cuisine: string | null,
  notes: string
}

Parse system prompt: "You convert food search queries from Pakistani users into JSON matching
this schema. Use PKR. 'Chips' means fries. Return only JSON." Then the schema, these rules:
- group_budget only when people or a total budget for several people is mentioned;
- a price limit for one dish goes in maxPricePerItem, not budget;
- "not fried" → avoidCookingMethods ["fried"]; "light"/"healthy" → put "healthy" in notes;
- singular lowercase dish words; leave unmentioned fields empty/null.
And 5 few-shot examples (query → full JSON) covering: calorie-targeted sandwich, cooking-method
query, group budget with required categories, price cap + exclusion + dietary tag, cuisine group.

parseQuery(provider, query): call with tier "fast". If it throws invalid_output, retry once with
the query plus "Your previous answer was invalid: <error>". Return constraints and timing.
```

---

## Prompt 4: Normalization

```text
Create src/lib/search/normalize.ts: a pure function normalizeConstraints(raw, query) → SearchPlan
{ constraints, categories, healthy, preferCheapest }. Unit-test every rule.

Rules:
- Map user words to the menu's real categories: chips/french fries/wedges → fries;
  cold drink/soft drink/soda/coke/juice → drink; roll/shawarma → wrap; sub/panini → sandwich;
  biryani/karahi/curry/daal → desi; tikka/kabab/seekh kabab → bbq; noodles/chow mein → chinese;
  naan/roti → bread; cake/sweet/ice cream → dessert. Handle plurals (burgers → burger,
  sandwiches → sandwich). `categories` = the known categories from dishTypes.
- Drop generic words from dishTypes: meal, food, dish, dinner, lunch, breakfast, snack.
- Normalize dietary tags: "protein"/"high protein" → high_protein, veg/veggie → vegetarian,
  keto/low carb → low_carb. Drop unknown tags.
- Remove any cooking method that is also avoided.
- Healthy rule: if the query or notes contain healthy/light/lean/clean/diet → when no cooking
  method was given use [grilled, steamed, raw, air_fried] (minus avoided), and cap calories at
  min(user cap, 550).
- Decide intent from the numbers, not the model's label: group if partySize >= 2, or a budget
  plus 2+ required categories. For a group: partySize ??= 1, requiredCategories default to the
  dish categories, and a cuisine that is also a category ("desi food for 2") becomes required.
  Otherwise single_dish: move budget into maxPricePerItem, clear budget/partySize/required.
- preferCheapest = query mentions cheap/cheapest/budget/affordable/sasta.

Lesson: models sometimes label "high protein under Rs. 1,000" as a group order. The
numbers-based intent rule prevents that.
```

---

## Prompt 5: Candidate retrieval

```text
Create retrieval in two parts so the logic is testable without a database:
- loadAreaMenu(areaSlug): open restaurants in the area, their available items, available deals,
  and an itemsById map (all items, for resolving deal lines). Throw AreaNotFoundError if unknown.
- filterCandidates(menu, plan) → { candidates, relaxed, exactCount }: pure.

Hard filters (never loosened):
- price <= maxPricePerItem
- excluded ingredients: word match in ingredients, name or description ("beef" removes
  "Beef Burger")
- cooking method not in avoidCookingMethods
- every requested dietary tag present
- onlyIngredients: every includeIngredient present

Soft filters, dropped one at a time in this order while fewer than 10 candidates remain:
1. calories: within targetCalories ±25%, and <= maxCalories
2. cooking method in cookingMethods
3. category in plan.categories

Always exclude drinks and desserts unless their category was asked for, even after loosening.

Then pre-score (ingredient matches ×3, dish word ×2, category +3, cooking method +2, calorie fit,
protein when high_protein, cuisine match, + rating × 0.3), sort, cap at 60.
exactCount = matches before any loosening (show "we relaxed X" only when exactCount is 0).

Also filterDeals(menu, constraints): keep a deal only if every line passes the hard filters
(ignore the per-item price cap for deals).

Lesson: relaxing "dish type" must not let drinks and desserts flood the results.
```

---

## Prompt 6: AI ranking

```text
Create rankItems(provider, query, constraints, candidates).

Send compact JSON: { request, constraints, items: [{ id, name, restaurant, category, desc,
price, kcal, protein_g, method (plain words like "air-fried", not enum names), ingredients,
tags }] }.

Rank system prompt: "Rank these menu items for the user's request. Only use item IDs from the
list. Reasons must cite real facts from the item data. Return only JSON: { results: [{ id,
matchScore, reason }] }." Add: at most 8 results; matchScore 0–100; reason max 20 words citing
calories, price, protein, cooking method or ingredients exactly as given; never invent numbers;
write prices like "Rs. 1,250" and calories like "315 kcal".

After the call, in code:
- drop IDs not in the candidate list and duplicates; if none survive, throw invalid_output
- clamp and round scores; truncate reasons to 20 words
- reason guard: extract every number > 25 from the reason; if any doesn't match (±1) a real fact
  (price, calories, protein, serves, delivery time, the user's targets), replace the reason with
  a code-written one, e.g. "Grilled sandwich with chicken and lettuce, 315 kcal, 30g protein,
  Rs. 590."
- sort by matchScore, then restaurant rating; at most 2 results with the same dish name; top 8.
```

---

## Prompt 7: Group & budget planner (code, not AI)

```text
Create src/lib/search/buildCombos.ts: pure functions, heavily unit-tested.

Input per open restaurant: its items and deals that passed the hard filters (for groups, only
"vegetarian" stays a strict dietary tag; taste tags like "spicy" are left to the picker).
If a cuisine was requested, only use restaurants whose cuisine matches (when any do).
Request: { budget | null, partySize, requiredCategories, preferCheapest }.

Offers per restaurant: all deals + the cheapest 2 items per category (4 for required
categories) + the cheapest sharing item (servesPeople > 1). Drinks only if requested. Max 24.
Each offer knows: unitPrice, servings (food only; drinks = 0), mains (servings of main
categories: burger, sandwich, wrap, pizza, desi, bbq, chinese, platter, bowl, salad, wings;
soup is a side), requestedMains, categories, menuValue, details for deals ("4× Burger + 2× Fries").

A combo is VALID when: subtotal + deliveryFee <= budget; every required category covered;
servings >= partySize; and mains >= partySize (one main per person), unless the request is only
sides/desserts.

Search: beam search over quantities (beam 200, depth <= partySize + required + 5), keyed by the
counts vector so permutations dedupe. Additions may happen in ANY order. Keep searching every
depth; don't stop early. Once valid, a combo may take up to 3 extras (non-main items like fries,
naan, drinks, dessert) within budget. Keep the cheapest 300 per restaurant.

Money (code only): lineTotal = unitPrice × qty; subtotal; total = subtotal + deliveryFee;
perPerson = ceil(total / partySize); savings = Σ (deal menuValue − deal price) × qty.

Score (normalized across all combos):
- default: 0.20 value (servings per rupee) + 0.20 deal savings + 0.15 variety (categories/3)
  + 0.15 rating + 0.15 focus (mains from requested categories) + 0.10 mains per person
  + 0.05 cheapness − 0.10 if servings > 2× party − 0.08 if one plain item is repeated for the
  whole group
- preferCheapest: 0.45 cheapness + 0.15 mains + 0.15 focus + 0.10 value + 0.15 rating
Return the top 50 with ids c1..c50, plus diversify(combos, n, perRestaurant) for the shortlist.

If no combo is valid: rerun without the budget and say, in code, "No single restaurant here can
serve X for N within Rs. B. The cheapest option is Rs. T at R."

Lessons (each was a real bug):
- Counting every servesPeople made "1 burger + a fries bucket" feed 6. Require a main per person.
- Forcing additions in index order + a beam made cheap combos unreachable (the beam kept only
  states with a drink, and a drink could not be followed by a lower-index main).
- Stopping once N valid combos were found missed the cheaper, deeper ones.
- Optimizing only for price gave "6× biryani" every time. Score savings and variety, and let
  price dominate only when the user says "cheap".
- Test "find the true cheapest" against a hand-computed answer.
```

---

## Prompt 8: Combo picking

```text
Create pickCombos(provider, query, request, shortlist) using the top 10 diversified combos
(max 4 per restaurant).

Send: { request, partySize, budget, mustInclude, combos: [{ comboId, restaurant, rating,
items (with deal contents), feeds, total, perPerson, deliveryFee, dealSavings }] }.

System prompt: "Pick the 3 best meal combinations for this group. Only use combo IDs given.
Return only JSON: { picks: [{ comboId, reason }] }." Add: every combo gives each person a main;
prefer feeding everyone well, covering the request and good value; variety across restaurants
is a plus; reason max 25 words citing restaurant, contents, total or per-person price exactly;
write prices like "Rs. 1,250".

In code: ignore unknown/duplicate IDs; run the same number guard (facts = totals, per-person,
fee, savings, servings, rating, budget, budget − total, line prices); fill up to 3 picks from the
score order with a code-written reason ("Feeds 4 with Desi, Drinks from X: Rs. 2,159 total,
Rs. 540 per person."). If preferCheapest, sort the final picks by total.
```

---

## Prompt 9: Keyword baseline

```text
Create keywordSearch(menu, query): today's naive search, used for the side-by-side comparison
and as the AI fallback. The whole query as a case-insensitive substring (like SQL ILIKE
'%query%') of item name, item description or restaurant name; available items from open
restaurants only; sorted by rating then price; max 20.

It is deliberately naive: "air fried fries" must NOT match "Air-Fried Fries". That contrast
is the point of the demo.
```

---

## Prompt 10: Search API

```text
Create POST /api/search and the orchestrator search(request).

Body (Zod): { query: string 3–200 chars (trimmed), areaSlug: /^[a-z0-9-]+$/,
mode: "ai" | "keyword" (default "ai") }.

Response: { mode: "ai" | "keyword" | "fallback", provider, fallbackUsed, latencyMs, cached,
constraints | null, type: "items" | "combos", items?: [{ item, restaurant, matchScore, reason }],
combos?: [{ restaurant, lines: [{ name, quantity, unitPrice, lineTotal, details? }], subtotal,
deliveryFee, total, perPerson, partySize, servings, savings, budget, withinBudget, reason }],
notice? }

Flow:
1. Rate limit: sliding window, 20 requests/min per IP (x-forwarded-for, else x-real-ip) →
   429 with Retry-After.
2. Cache: in memory, TTL 1 h, LRU 500, key = `v{VERSION}|area|mode|normalizedQuery`
   (lowercase, collapse spaces, trim, then strip trailing punctuation, then trim again).
   Bump VERSION whenever the pipeline changes. Never cache fallbacks.
3. Load the area menu (unknown area → 400).
4. keyword mode → keywordSearch.
5. ai mode → parse → normalize → group ? build + pick combos : retrieve + rank.
   On any LLMError (or missing LLM config) → keyword results, mode "fallback",
   notice "AI unavailable, showing keyword results".
6. Log every search to SearchLog without blocking the response; log errors, don't throw.
7. Server errors → friendly JSON message; details only in the server log.

Also log per-step timings (parse ms, rank ms) to find slow steps.
```

---

## Prompt 11: Tests & acceptance

```text
Write Vitest unit tests (no database, no API key needed) with small fixtures:
- normalize: chips → fries, healthy rule, lone price cap → per-item, party size → group,
  cuisine → required category, cheapest detection, generic words dropped
- retrieval: exclusions by name, hard filters never loosened, loosening order, drinks never
  sneak in, cap 60, deals with excluded lines dropped
- buildCombos: total = subtotal + fee, never over budget, required categories covered, a main
  per person, deal savings and per-person math, true cheapest equals a hand-computed answer,
  empty when the budget is impossible, drinks never feed people
- schemas: defaults, coercion, clamped scores, fence stripping, invalid_output errors
- reason guard, cache TTL/LRU, rate limiter, query normalization

Then run these queries against the live API (pace them for free-tier limits) and report a table:
query, type, top result, latency, pass/fail.
  chicken and lettuce sandwich around 300 calories | air fried fries |
  3000 PKR for 6 people, burgers and chips | high protein under 1000 PKR, no beef |
  something light, not fried | spicy desi food for 2 under 2000 | vegetarian dinner |
  cheapest meal for 4 with drinks | dinner for 4 people under Rs. 4,000
Acceptance: no dish that isn't in the DB, no budget exceeded, sensible top results, < 5 s.
Also check each demo query in keyword mode: the best demo queries return 0 there.

Lesson: check that a flagship demo query is actually possible with your data before building a
pitch around it (here, "Rs. 3,000 for 6 with burgers" had no valid answer; the cheapest was
Rs. 3,909).
```

---

## Prompt 12: Search UI (optional)

```text
Build the search page (client component, query in the URL: ?area=&q=&compare=1):
- Search box + example chips (hero query first); area picker in the header.
- Loading skeletons ("Reading the menus of N restaurants…"), empty states, and an "AI is busy"
  state with a Try again button (retry re-runs the same search; fallbacks aren't cached).
- "Understood as:" chips from the parsed constraints (e.g. sandwich · chicken · lettuce ·
  ~300 kcal · budget Rs. 4,000 · 4 people) so viewers see what the AI understood.
- Dish card: name, restaurant, price, calories (with an "AI estimate" badge when
  caloriesSource = ai_estimate), protein, cooking method, match-score bar, reason.
- Combo card: restaurant, lines with quantities and deal contents, subtotal, delivery fee,
  total, per person, "Within budget", "Deals save Rs. X", budget left, reason.
- Compare toggle: "Today's search" (keyword) and "AI search" side by side.
Mobile-first; check at 390 px and 1280 px wide.
```

---

## Tips

- **Pre-warm the demo:** run every demo query once before presenting; the cache makes them
  instant and free. For recordings, consider persisting successful AI answers so an API outage
  or restart can't break the demo.
- **Free tiers go down:** during testing, every Gemini model returned 503 "high demand" at
  once. A second provider (e.g. Groq) as an automatic backup is cheap insurance.
- **Keep the laptop awake** during long test runs and live demos; sleep freezes timers and
  drops connections.
