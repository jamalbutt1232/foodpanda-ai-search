import Link from "next/link";
import { Tag, Users } from "lucide-react";
import { formatPkr } from "@/lib/format/formatPkr";
import { cn } from "@/lib/utils";
import type { DealDTO } from "@/types/restaurant";

type DealCardProps = {
  deal: DealDTO;
  /** Shown when the card appears outside its restaurant page. */
  restaurant?: { name: string; slug: string };
};

export function DealCard({ deal, restaurant }: DealCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
        !deal.isAvailable && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 bg-brand-soft px-4 py-2">
        {deal.isAvailable && deal.savings > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm font-extrabold text-brand">
            <Tag className="size-4" aria-hidden />
            Save {formatPkr(deal.savings)}
          </span>
        ) : (
          <span className="text-sm font-extrabold text-brand">Deal</span>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70">
          <Users className="size-3.5" aria-hidden />
          Serves {deal.servesPeople}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="leading-snug font-extrabold">{deal.name}</h3>
          {restaurant && (
            <Link
              href={`/restaurant/${restaurant.slug}`}
              className="text-sm font-bold text-brand hover:underline"
            >
              {restaurant.name}
            </Link>
          )}
        </div>
        <ul className="space-y-0.5 text-sm text-muted-foreground">
          {deal.lines.map((line) => (
            <li key={line.menuItemId}>
              <span className="font-bold text-foreground">{line.quantity}×</span> {line.name}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {deal.isAvailable ? (
            <>
              <span className="text-lg font-extrabold">{formatPkr(deal.price)}</span>
              {deal.savings > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPkr(deal.menuValue)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-bold text-muted-foreground">Currently unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}
