"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { PromoBanner } from "@/components/browse/PromoBanner";
import { CompareView } from "@/components/results/CompareView";
import { ResultsList } from "@/components/results/ResultsList";
import { ExampleChips } from "@/components/search/ExampleChips";
import { ModeToggle } from "@/components/search/ModeToggle";
import { SearchBar } from "@/components/search/SearchBar";
import { useSearch } from "@/components/search/useSearch";
import { EXAMPLE_QUERIES } from "@/lib/examples";
import type { AreaDTO } from "@/types/restaurant";

type SearchExperienceProps = {
  area: AreaDTO;
  restaurantCount: number;
  /** Browse content (cuisines, deals, restaurants) shown when there is no query. */
  children: ReactNode;
};

export function SearchExperience({ area, restaurantCount, children }: SearchExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  const query = searchParams.get("q")?.trim() ?? "";
  const compare = searchParams.get("compare") === "1";
  const hasQuery = query.length >= 3;

  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((n) => n + 1);
  const ai = useSearch(query, area.slug, "ai", hasQuery, attempt);
  const keyword = useSearch(query, area.slug, "keyword", hasQuery && compare);

  function navigate(update: Record<string, string | null>, scrollToResults = false) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("area", area.slug);
    for (const [key, value] of Object.entries(update)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
    if (scrollToResults && window.innerWidth < 768) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="space-y-8">
      <section id="search" className="scroll-mt-24 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Hungry? Just say what you&apos;re craving.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {restaurantCount} restaurants delivering to {area.name} right now
          </p>
        </div>
        <SearchBar
          initialQuery={query}
          isSearching={ai.status === "loading"}
          onSearch={(q) => navigate({ q }, true)}
          onClear={() => navigate({ q: null })}
        />
        <ExampleChips activeQuery={query} onPick={(q) => navigate({ q }, true)} />
      </section>

      <div ref={resultsRef} className="scroll-mt-24">
        {hasQuery ? (
          <section aria-label="Search results" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold tracking-tight">
                Results for <span className="text-brand">&ldquo;{query}&rdquo;</span>
              </h2>
              <ModeToggle
                compare={compare}
                onChange={(on) => navigate({ compare: on ? "1" : null })}
              />
            </div>
            {compare ? (
              <CompareView
                keyword={keyword}
                ai={ai}
                restaurantCount={restaurantCount}
                onRetry={retry}
              />
            ) : (
              <ResultsList
                state={ai}
                variant="ai"
                restaurantCount={restaurantCount}
                onRetry={retry}
              />
            )}
          </section>
        ) : (
          <div className="space-y-10">
            <PromoBanner
              onTry={() => navigate({ q: EXAMPLE_QUERIES[0].query, compare: "1" }, true)}
            />
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
