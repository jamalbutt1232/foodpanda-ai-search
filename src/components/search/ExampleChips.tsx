"use client";

import { Sparkles } from "lucide-react";
import { EXAMPLE_QUERIES } from "@/lib/examples";
import { cn } from "@/lib/utils";

type ExampleChipsProps = {
  activeQuery: string;
  onPick: (query: string) => void;
};

export function ExampleChips({ activeQuery, onPick }: ExampleChipsProps) {
  return (
    <div
      className="-mx-4 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      aria-label="Example searches"
    >
      <span className="shrink-0 text-sm font-bold text-muted-foreground">Try asking:</span>
      {EXAMPLE_QUERIES.map((example) => {
        const active = example.query.toLowerCase() === activeQuery.trim().toLowerCase();
        return (
          <button
            key={example.label}
            type="button"
            onClick={() => onPick(example.query)}
            aria-pressed={active}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
              active
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-brand ring-1 ring-brand/30 hover:bg-brand-soft",
            )}
          >
            <Sparkles className="size-3.5" aria-hidden />
            {example.label}
          </button>
        );
      })}
    </div>
  );
}
