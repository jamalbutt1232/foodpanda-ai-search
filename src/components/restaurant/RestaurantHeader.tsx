import Link from "next/link";
import { ArrowLeft, Bike, Clock, MapPin, Star } from "lucide-react";
import { CuisineCover } from "@/components/browse/CuisineCover";
import { formatPkr } from "@/lib/format/formatPkr";
import type { RestaurantDTO } from "@/types/restaurant";

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantDTO }) {
  const { name, cuisine, area, rating, deliveryTimeMin, deliveryFee, isOpen } = restaurant;

  return (
    <header className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl">
        <CuisineCover cuisine={cuisine} className="h-44 sm:h-60" />
        <Link
          href={`/?area=${area.slug}`}
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-md hover:text-brand"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
        {!isOpen && (
          <span className="absolute top-4 right-4 rounded-full bg-foreground px-3 py-1.5 text-sm font-bold text-white">
            Closed
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden />
            {cuisine} · {area.name}, {area.city}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
            {rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">rating</span>
          </p>
        </div>

        <dl className="flex gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-2xl bg-[#f4f4f5] px-3.5 py-2.5">
            <Clock className="size-5 text-brand" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Delivery</dt>
              <dd className="font-bold">
                {deliveryTimeMin}–{deliveryTimeMin + 15} min
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#f4f4f5] px-3.5 py-2.5">
            <Bike className="size-5 text-brand" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Delivery fee</dt>
              <dd className="font-bold">{formatPkr(deliveryFee)}</dd>
            </div>
          </div>
        </dl>
      </div>
    </header>
  );
}
