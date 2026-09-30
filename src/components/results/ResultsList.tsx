import { RotateCw, Zap } from "lucide-react";
import { ComboCard } from "@/components/results/ComboCard";
import { EmptyState } from "@/components/results/EmptyState";
import { FallbackNotice } from "@/components/results/FallbackNotice";
import { ItemCard } from "@/components/results/ItemCard";
import { ResultsSkeleton } from "@/components/results/ResultsSkeleton";
import type { SearchState } from "@/components/search/useSearch";
import { UnderstoodChips } from "@/components/search/UnderstoodChips";
import { cn } from "@/lib/utils";
import type { SearchResponse } from "@/types/search";

type ResultsListProps = {
  state: SearchState;
  variant: "ai" | "keyword";
  /** Single column inside the compare view. */
  narrow?: boolean;
  restaurantCount: number;
  onRetry?: () => void;
};

function RetryButton({ onRetry }: { onRetry?: () => void }) {
  if (!onRetry) return null;
  return (
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-strong"
    >
      <RotateCw className="size-4" aria-hidden />
      Try again
    </button>
  );
}

function Meta({ data }: { data: SearchResponse }) {
  const count = data.items?.length ?? data.combos?.length ?? 0;
  const what =
    data.type === "combos"
      ? count === 1
        ? "meal option"
        : "meal options"
      : count === 1
        ? "dish"
        : "dishes";
  return (
    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Zap className="size-3.5 text-brand" aria-hidden />
      {count} {what} · {data.cached ? "instant (cached)" : `${(data.latencyMs / 1000).toFixed(1)}s`}
    </p>
  );
}

function KeywordResults({ data }: { data: SearchResponse }) {
  const items = data.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No results"
        message="Today's search only matches these exact words in dish or restaurant names."
      />
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {items.length} exact-word {items.length === 1 ? "match" : "matches"}
      </p>
      {items.map((result) => (
        <ItemCard key={result.item.id} result={result} compact />
      ))}
    </div>
  );
}

function FallbackResults({ data, onRetry }: { data: SearchResponse; onRetry?: () => void }) {
  const items = data.items ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">Our AI is busy right now</p>
          <p className="text-sm">
            {items.length > 0
              ? "Showing keyword results instead. Try again in a moment for AI results."
              : "Keyword search found nothing for this. Try again in a moment."}
          </p>
        </div>
        <RetryButton onRetry={onRetry} />
      </div>
      {items.map((result) => (
        <ItemCard key={result.item.id} result={result} compact />
      ))}
    </div>
  );
}

function AiResults({ data, narrow }: { data: SearchResponse; narrow: boolean }) {
  const grid = cn(
    "grid gap-3",
    !narrow && "md:grid-cols-2",
    !narrow && data.type === "combos" && "lg:grid-cols-3",
  );
  const items = data.items ?? [];
  const combos = data.combos ?? [];
  const empty = data.type === "combos" ? combos.length === 0 : items.length === 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Meta data={data} />
        {data.constraints && <UnderstoodChips constraints={data.constraints} />}
      </div>
      {data.notice && <FallbackNotice tone="info" message={data.notice} />}

      {empty && !data.notice && (
        <EmptyState title="Nothing matched" message="Try another area or a looser request." />
      )}
      {data.type === "combos" ? (
        <div className={grid}>
          {combos.map((combo, i) => (
            <ComboCard key={`${combo.restaurant.id}-${i}`} combo={combo} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className={grid}>
          {items.map((result, i) => (
            <ItemCard key={result.item.id} result={result} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ResultsList({
  state,
  variant,
  narrow = false,
  restaurantCount,
  onRetry,
}: ResultsListProps) {
  if (state.status === "idle") return null;
  if (state.status === "loading") {
    return (
      <ResultsSkeleton
        compact={variant === "keyword" || narrow}
        count={variant === "keyword" ? 3 : 4}
        label={
          variant === "ai" ? `Reading the menus of ${restaurantCount} restaurants…` : undefined
        }
      />
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <FallbackNotice message={state.message} />
        <RetryButton onRetry={onRetry} />
      </div>
    );
  }
  if (variant === "ai" && state.data.fallbackUsed) {
    return <FallbackResults data={state.data} onRetry={onRetry} />;
  }
  return variant === "keyword" ? (
    <KeywordResults data={state.data} />
  ) : (
    <AiResults data={state.data} narrow={narrow} />
  );
}
