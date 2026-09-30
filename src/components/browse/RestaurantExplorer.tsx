"use client";

import { useState, type ReactNode } from "react";
import { RestaurantCard } from "@/components/browse/RestaurantCard";
import { FoodArt } from "@/components/shared/FoodArt";
import { cn } from "@/lib/utils";
import type { RestaurantSummaryDTO } from "@/types/restaurant";

type Cuisine = {
  label: string;
  art: string;
  matches: (r: RestaurantSummaryDTO) => boolean;
};

const has = (r: RestaurantSummaryDTO, ...cats: string[]) =>
  cats.some((c) => r.categories.includes(c));
const says = (r: RestaurantSummaryDTO, word: string) => r.cuisine.toLowerCase().includes(word);

const CUISINES: Cuisine[] = [
  { label: "Burgers", art: "burger", matches: (r) => has(r, "burger") },
  { label: "Pizza", art: "pizza", matches: (r) => has(r, "pizza") },
  { label: "Desi", art: "desi", matches: (r) => has(r, "desi") || says(r, "desi") },
  { label: "BBQ", art: "bbq", matches: (r) => has(r, "bbq") || says(r, "bbq") },
  { label: "Chinese", art: "chinese", matches: (r) => has(r, "chinese") },
  { label: "Healthy", art: "salad", matches: (r) => says(r, "healthy") || has(r, "salad", "bowl") },
  { label: "Sandwiches", art: "sandwich", matches: (r) => has(r, "sandwich") },
  { label: "Rolls", art: "wrap", matches: (r) => has(r, "wrap") },
  { label: "Desserts", art: "dessert", matches: (r) => has(r, "dessert") },
];

/** Round cuisine shortcuts (filter in the browser, no AI call) + the restaurant grid. */
export function RestaurantExplorer({
  restaurants,
  areaName,
  between,
}: {
  restaurants: RestaurantSummaryDTO[];
  areaName: string;
  /** Rendered between the cuisine row and the grid (e.g. the deals carousel). */
  between?: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  // Only offer cuisines this area actually serves.
  const available = CUISINES.filter((c) => restaurants.some(c.matches));
  const active = available.find((c) => c.label === selected);
  const shown = active ? restaurants.filter(active.matches) : restaurants;

  return (
    <div className="space-y-8">
      <section aria-labelledby="cuisines-title">
        <h2 id="cuisines-title" className="mb-3 text-xl font-extrabold tracking-tight">
          Cuisines
        </h2>
        <ul className="-mx-4 flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6">
          {available.map((c) => {
            const isActive = c.label === selected;
            return (
              <li key={c.label} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelected(isActive ? null : c.label)}
                  aria-pressed={isActive}
                  className="group flex w-20 flex-col items-center gap-2"
                >
                  <FoodArt
                    kind={c.art}
                    className={cn(
                      "size-20 rounded-full ring-offset-2 transition-all",
                      isActive
                        ? "ring-3 ring-brand"
                        : "group-hover:ring-2 group-hover:ring-brand/40",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isActive ? "text-brand" : "text-foreground/80",
                    )}
                  >
                    {c.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {!active && between && <div>{between}</div>}

      <section aria-labelledby="restaurants-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="restaurants-title" className="text-xl font-extrabold tracking-tight">
            {active ? `${active.label} in ${areaName}` : `All restaurants in ${areaName}`}
          </h2>
          {active && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm font-bold text-brand hover:underline"
            >
              Show all
            </button>
          )}
        </div>
        {shown.length > 0 ? (
          <ul className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((restaurant) => (
              <li key={restaurant.id}>
                <RestaurantCard restaurant={restaurant} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
            No restaurants deliver to {areaName} yet. Try another area.
          </p>
        )}
      </section>
    </div>
  );
}
