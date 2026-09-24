import Link from "next/link";
import { Bike, Clock, Star, Tag } from "lucide-react";
import { CuisineCover } from "@/components/browse/CuisineCover";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/format/formatPkr";
import type { RestaurantSummaryDTO } from "@/types/restaurant";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummaryDTO }) {
  const { slug, name, cuisine, rating, deliveryTimeMin, deliveryFee, isOpen } = restaurant;

  return (
    <Link
      href={`/restaurant/${slug}`}
      className={cn(
        "group block overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand/30 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        !isOpen && "opacity-70 grayscale",
      )}
    >
      <div className="relative">
        <CuisineCover cuisine={cuisine} className="h-32 sm:h-36" />
        {restaurant.dealCount > 0 && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            <Tag className="size-3" aria-hidden />
            {restaurant.dealCount} {restaurant.dealCount === 1 ? "deal" : "deals"}
          </span>
        )}
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium shadow-sm">
          <Clock className="size-3" aria-hidden />
          {isOpen ? `${deliveryTimeMin} min` : "Closed"}
        </span>
      </div>

      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-snug font-semibold group-hover:text-brand">{name}</h3>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {rating.toFixed(1)}
          </span>
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {cuisine}
          {restaurant.highlights.length > 0 && ` · ${restaurant.highlights.join(", ")}`}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bike className="size-3.5" aria-hidden />
            {formatPkr(deliveryFee)}
          </span>
          {restaurant.startingPrice !== null && (
            <span>From {formatPkr(restaurant.startingPrice)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
