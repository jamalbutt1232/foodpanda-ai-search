import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/format/formatPkr";
import type { DealDTO } from "@/types/restaurant";

type DealCardProps = {
  deal: DealDTO;
  /** Shown when the card appears outside its restaurant page. */
  restaurant?: { name: string; slug: string };
};

export function DealCard({ deal, restaurant }: DealCardProps) {
  return (
    <Card className={cn("h-full", !deal.isAvailable && "opacity-60")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="leading-snug">{deal.name}</CardTitle>
            {restaurant && (
              <Link
                href={`/restaurant/${restaurant.slug}`}
                className="mt-0.5 block text-xs font-medium text-brand hover:underline"
              >
                {restaurant.name}
              </Link>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 font-normal">
            <Users aria-hidden />
            Serves {deal.servesPeople}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-1 text-sm text-muted-foreground">
          {deal.lines.map((line) => (
            <li key={line.menuItemId}>
              <span className="font-medium text-foreground">{line.quantity}×</span> {line.name}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/40 py-3">
        {deal.isAvailable ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold">{formatPkr(deal.price)}</span>
              {deal.savings > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPkr(deal.menuValue)}
                </span>
              )}
            </div>
            {deal.savings > 0 && (
              <span className="text-xs font-medium text-emerald-700">
                Save {formatPkr(deal.savings)}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Currently unavailable</span>
        )}
      </CardFooter>
    </Card>
  );
}
