import Link from "next/link";
import { ArrowLeft, Bike, Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format/formatPkr";
import type { RestaurantDTO } from "@/types/restaurant";

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantDTO }) {
  const { name, cuisine, area, rating, deliveryTimeMin, deliveryFee, isOpen } = restaurant;

  return (
    <header className="space-y-4">
      <Link
        href={`/?area=${area.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to search
      </Link>

      <div className="rounded-2xl bg-brand-soft/60 p-5 ring-1 ring-brand/10 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {cuisine} · {area.name}, {area.city}
            </p>
          </div>
          {isOpen ? (
            <Badge className="bg-emerald-600 text-white">Open now</Badge>
          ) : (
            <Badge variant="secondary">Closed</Badge>
          )}
        </div>

        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            <dt className="sr-only">Rating</dt>
            <dd className="font-medium">{rating.toFixed(1)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Delivery time</dt>
            <dd>{deliveryTimeMin} min</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Bike className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Delivery fee</dt>
            <dd>{formatPkr(deliveryFee)} delivery</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
