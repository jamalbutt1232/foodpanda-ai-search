"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Hamburger, Pizza, Salad, Soup } from "lucide-react";
import { CompareView } from "@/components/results/CompareView";
import { ResultsList } from "@/components/results/ResultsList";
import { AreaSelector } from "@/components/search/AreaSelector";
import { ExampleChips } from "@/components/search/ExampleChips";
import { ModeToggle } from "@/components/search/ModeToggle";
import { SearchBar } from "@/components/search/SearchBar";
import { useSearch } from "@/components/search/useSearch";
import type { AreaDTO } from "@/types/restaurant";

type SearchExperienceProps = {
  areas: AreaDTO[];
  area: AreaDTO;
  restaurantCount: number;
  /** Browse content (deals, restaurants) shown when there is no query. */
  children: ReactNode;
};

export function SearchExperience({
  areas,
  area,
  restaurantCount,
  children,
}: SearchExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  const query = searchParams.get("q")?.trim() ?? "";
  const compare = searchParams.get("compare") === "1";
  const hasQuery = query.length >= 3;

  const ai = useSearch(query, area.slug, "ai", hasQuery);
  const keyword = useSearch(query, area.slug, "keyword", hasQuery && compare);

  function navigate(update: Record<string, string | null>, scrollToResults = false) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("area", area.slug);
    for (const [key, value] of Object.entries(update)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
    // On phones the hero fills the screen; bring the results into view.
    if (scrollToResults && window.innerWidth < 768) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-brand px-4 py-7 text-white sm:px-10 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 text-white/10">
          <Hamburger className="absolute top-4 right-4 size-20 rotate-12 sm:right-14 sm:size-32" />
          <Pizza className="absolute right-44 -bottom-6 hidden size-28 -rotate-12 lg:block" />
          <Salad className="absolute top-8 right-80 hidden size-20 rotate-6 xl:block" />
          <Soup className="absolute -bottom-4 left-1/2 size-16 -rotate-6" />
        </div>
        <div className="relative max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-white/85">
              {restaurantCount} restaurants delivering in {area.name}
            </p>
            <AreaSelector areas={areas} value={area.slug} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Hungry? Just say what you&apos;re craving.
          </h1>
          <SearchBar
            initialQuery={query}
            isSearching={ai.status === "loading"}
            onSearch={(q) => navigate({ q }, true)}
            onClear={() => navigate({ q: null })}
          />
          <ExampleChips activeQuery={query} onPick={(q) => navigate({ q }, true)} />
        </div>
      </section>

      <div ref={resultsRef} className="scroll-mt-20">
        {hasQuery ? (
          <section aria-label="Search results" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">
                Results for <span className="text-brand">&ldquo;{query}&rdquo;</span>
              </h2>
              <ModeToggle
                compare={compare}
                onChange={(on) => navigate({ compare: on ? "1" : null })}
              />
            </div>
            {compare ? (
              <CompareView keyword={keyword} ai={ai} restaurantCount={restaurantCount} />
            ) : (
              <ResultsList state={ai} variant="ai" restaurantCount={restaurantCount} />
            )}
          </section>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
