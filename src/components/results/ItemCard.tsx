import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { MatchScore } from "@/components/results/MatchScore";
import { FoodThumb } from "@/components/results/FoodThumb";
import { ReasonCallout } from "@/components/results/ReasonCallout";
import { ItemFacts } from "@/components/shared/ItemFacts";
import { formatPkr } from "@/lib/format/formatPkr";
import { cn } from "@/lib/utils";
import type { ItemResult } from "@/types/search";

type ItemCardProps = {
  result: ItemResult;
  rank?: number;
  /** Compact = the plain "Today's search" style: no score, no reason. */
  compact?: boolean;
};

export function ItemCard({ result, rank, compact = false }: ItemCardProps) {
  const { item, restaurant, matchScore, reason } = result;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10",
        !compact && "transition-shadow hover:shadow-md",
      )}
    >
      <div className="flex gap-3">
        <div className="relative">
          <FoodThumb
            category={item.category}
            className={compact ? "size-14" : "size-16 sm:size-20"}
          />
          {rank !== undefined && (
            <span className="absolute -top-1.5 -left-1.5 flex size-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white ring-2 ring-card">
              {rank}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="leading-snug font-semibold">{item.name}</h3>
            <p className="shrink-0 font-semibold">{formatPkr(item.price)}</p>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            <Link
              href={`/restaurant/${restaurant.slug}`}
              className="font-medium text-brand hover:underline"
            >
              {restaurant.name}
            </Link>
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {restaurant.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="size-3.5" aria-hidden />
              {restaurant.deliveryTimeMin} min
            </span>
          </p>
          {!compact && matchScore !== null && (
            <div className="mt-2">
              <MatchScore score={matchScore} />
            </div>
          )}
        </div>
      </div>
      {!compact && <ItemFacts {...item} />}
      {!compact && reason && <ReasonCallout reason={reason} />}
    </article>
  );
}
