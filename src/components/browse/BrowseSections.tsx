import { RestaurantExplorer } from "@/components/browse/RestaurantExplorer";
import { DealCard } from "@/components/restaurant/DealCard";
import type { AreaBrowseDTO } from "@/types/restaurant";

/** Default home content before a search: cuisines, daily deals, all restaurants. */
export function BrowseSections({ browse }: { browse: AreaBrowseDTO }) {
  const { area, restaurants, topDeals } = browse;

  const deals =
    topDeals.length > 0 ? (
      <section aria-labelledby="deals-title">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="deals-title" className="text-xl font-extrabold tracking-tight">
            Your daily deals
          </h2>
          <span className="text-sm font-semibold text-muted-foreground">Biggest savings first</span>
        </div>
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {topDeals.map((deal) => (
            <li key={deal.id} className="w-72 shrink-0 snap-start">
              <DealCard deal={deal} restaurant={deal.restaurant} />
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return <RestaurantExplorer restaurants={restaurants} areaName={area.name} between={deals} />;
}
