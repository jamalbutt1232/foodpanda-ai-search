import { Search, Sparkles } from "lucide-react";
import { ResultsList } from "@/components/results/ResultsList";
import type { SearchState } from "@/components/search/useSearch";

type CompareViewProps = {
  keyword: SearchState;
  ai: SearchState;
  restaurantCount: number;
  onRetry?: () => void;
};

/** The pitch moment: the same query through today's keyword search and through AI search. */
export function CompareView({ keyword, ai, restaurantCount, onRetry }: CompareViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-labelledby="today-title" className="rounded-3xl bg-muted/60 p-4 sm:p-5">
        <header className="mb-4">
          <h2 id="today-title" className="flex items-center gap-2 text-lg font-semibold">
            <Search className="size-5 text-muted-foreground" aria-hidden />
            Today&apos;s search
          </h2>
          <p className="text-sm text-muted-foreground">Matches the exact words you typed</p>
        </header>
        <ResultsList state={keyword} variant="keyword" narrow restaurantCount={restaurantCount} />
      </section>

      <section
        aria-labelledby="ai-title"
        className="rounded-3xl bg-brand-soft/40 p-4 ring-2 ring-brand/30 sm:p-5"
      >
        <header className="mb-4">
          <h2 id="ai-title" className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-5 text-brand" aria-hidden />
            AI search
          </h2>
          <p className="text-sm text-muted-foreground">Understands what you mean</p>
        </header>
        <ResultsList
          state={ai}
          variant="ai"
          narrow
          restaurantCount={restaurantCount}
          onRetry={onRetry}
        />
      </section>
    </div>
  );
}
