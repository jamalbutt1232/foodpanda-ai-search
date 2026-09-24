import Link from "next/link";
import { CircleCheck, Clock, PiggyBank, Star, Users } from "lucide-react";
import { ReasonCallout } from "@/components/results/ReasonCallout";
import { formatPkr } from "@/lib/format/formatPkr";
import type { ComboResult } from "@/types/search";

export function ComboCard({ combo, rank }: { combo: ComboResult; rank: number }) {
  const { restaurant, budget } = combo;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <header className="flex items-start justify-between gap-3 border-b bg-brand-soft/50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Option {rank}</p>
          <Link
            href={`/restaurant/${restaurant.slug}`}
            className="leading-snug font-semibold hover:text-brand hover:underline"
          >
            {restaurant.name}
          </Link>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
              {restaurant.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="size-3" aria-hidden />
              {restaurant.deliveryTimeMin} min
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="size-3" aria-hidden />
              feeds {combo.servings}
            </span>
          </p>
        </div>
        {combo.withinBudget && budget !== null && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
            <CircleCheck className="size-3.5" aria-hidden />
            Within budget
          </span>
        )}
      </header>

      <ul className="space-y-2 px-4 py-3 text-sm">
        {combo.lines.map((line) => (
          <li key={line.name} className="flex justify-between gap-3">
            <div className="min-w-0">
              <span className="font-medium">{line.quantity}×</span> {line.name}
              {line.details && <p className="text-xs text-muted-foreground">{line.details}</p>}
            </div>
            <span className="shrink-0 tabular-nums">{formatPkr(line.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-auto space-y-1 border-t px-4 py-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPkr(combo.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt>Delivery fee</dt>
          <dd className="tabular-nums">{formatPkr(combo.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPkr(combo.total)}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-sm font-medium text-brand">
            {formatPkr(combo.perPerson)} per person
          </span>
          {combo.savings > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <PiggyBank className="size-3.5" aria-hidden />
              Deals save {formatPkr(combo.savings)}
            </span>
          )}
        </div>
        {budget !== null && combo.withinBudget && budget > combo.total && (
          <p className="text-xs text-muted-foreground">
            {formatPkr(budget - combo.total)} left of your {formatPkr(budget)}
          </p>
        )}
      </dl>

      <div className="px-4 pb-4">
        <ReasonCallout reason={combo.reason} />
      </div>
    </article>
  );
}
