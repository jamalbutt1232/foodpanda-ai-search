/** Demo queries shown as chips on the search page and on /about. Hero query first. */
export const EXAMPLE_QUERIES = [
  { label: "Dinner for 4 under Rs. 4,000", query: "Dinner for 4 people under Rs. 4,000" },
  {
    label: "Chicken lettuce sandwich ~300 cal",
    query: "Chicken and lettuce sandwich around 300 calories",
  },
  // Typed the way people type it: no hyphen, so exact-word search misses "Air-Fried Fries".
  { label: "Air-fried fries", query: "air fried fries" },
  {
    label: "Rs. 5,000 for 6: burgers + chips",
    query: "Rs. 5,000 for 6 people, must include burgers and chips",
  },
  { label: "High protein under Rs. 1,000", query: "High protein under Rs. 1,000, no beef" },
  { label: "Something light and not fried", query: "Something light and not fried" },
] as const;

export function searchHref(query: string, area = "gulberg", compare = false): string {
  const params = new URLSearchParams({ area, q: query });
  if (compare) params.set("compare", "1");
  return `/?${params.toString()}`;
}
