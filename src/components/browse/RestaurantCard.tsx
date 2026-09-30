import Link from "next/link";
import { Bike, Star } from "lucide-react";
import { CuisineCover } from "@/components/browse/CuisineCover";
import { formatPkr } from "@/lib/format/formatPkr";
import { cn } from "@/lib/utils";
import type { RestaurantSummaryDTO } from "@/types/restaurant";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummaryDTO }) {
  const { slug, name, cuisine, rating, deliveryTimeMin, deliveryFee, isOpen } = restaurant;

  return (
    <Link
      href={`/restaurant/${slug}`}
      className={cn(
        "group block rounded-2xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
        !isOpen && "opacity-60 grayscale",
      )}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <CuisineCover
          cuisine={cuisine}
          className="aspect-[16/9] transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {restaurant.maxDealSavings > 0 && (
          <span className="absolute top-3 left-0 rounded-r-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-md">
            Save up to {formatPkr(restaurant.maxDealSavings)}
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-md">
          {isOpen ? `${deliveryTimeMin}–${deliveryTimeMin + 15} min` : "Closed"}
        </span>
      </div>

      <div className="px-0.5 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base leading-snug font-bold group-hover:text-brand">{name}</h3>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            {rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
          {cuisine}
          {restaurant.highlights.length > 0 && ` · ${restaurant.highlights.join(", ")}`}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bike className="size-4 text-brand" aria-hidden />
            {formatPkr(deliveryFee)} delivery
          </span>
          {restaurant.startingPrice !== null && (
            <span>· From {formatPkr(restaurant.startingPrice)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
