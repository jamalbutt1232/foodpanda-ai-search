import { RestaurantCard } from "@/components/browse/RestaurantCard";
import { DealCard } from "@/components/restaurant/DealCard";
import type { AreaBrowseDTO } from "@/types/restaurant";

/** Default home content before a search: top deals and restaurants in the area. */
export function BrowseSections({ browse }: { browse: AreaBrowseDTO }) {
  const { area, restaurants, topDeals } = browse;

  return (
    <div className="space-y-10">
      {topDeals.length > 0 && (
        <section aria-labelledby="deals-title">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="deals-title" className="text-xl font-semibold tracking-tight">
              Top deals in {area.name}
            </h2>
            <span className="text-sm text-muted-foreground">Biggest savings first</span>
          </div>
          <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6">
            {topDeals.map((deal) => (
              <li key={deal.id} className="w-72 shrink-0 snap-start">
                <DealCard deal={deal} restaurant={deal.restaurant} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="restaurants-title">
        <h2 id="restaurants-title" className="mb-3 text-xl font-semibold tracking-tight">
          Restaurants in {area.name}{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({restaurants.length})
          </span>
        </h2>
        {restaurants.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <RestaurantCard restaurant={restaurant} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
            No restaurants deliver to {area.name} yet. Try another area.
          </p>
        )}
      </section>
    </div>
  );
}
