"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Search, X } from "lucide-react";

type SearchBarProps = {
  initialQuery: string;
  isSearching: boolean;
  onSearch: (query: string) => void;
  onClear: () => void;
};

export function SearchBar({ initialQuery, isSearching, onSearch, onClear }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const [hint, setHint] = useState<string | null>(null);

  // Keep the box in sync when a chip or the back button changes the query.
  useEffect(() => setValue(initialQuery), [initialQuery]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (query.length < 3) {
      setHint("Tell us a bit more, at least 3 characters.");
      return;
    }
    setHint(null);
    onSearch(query);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      <div className="flex items-center gap-2 rounded-full bg-[#f4f4f5] p-1.5 pl-5 ring-1 ring-transparent transition-shadow focus-within:bg-white focus-within:shadow-lg focus-within:ring-brand/40">
        <Search className="size-5 shrink-0 text-foreground/60" aria-hidden />
        <label htmlFor="search-input" className="sr-only">
          What are you craving?
        </label>
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={200}
          autoComplete="off"
          placeholder="Search dishes, or just describe what you’re craving"
          className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setHint(null);
              onClear();
            }}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSearching}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand px-4 font-extrabold text-white transition-colors hover:bg-brand-strong disabled:opacity-80 sm:px-6"
        >
          {isSearching ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Search className="size-4 sm:hidden" aria-hidden />
          )}
          <span className="hidden sm:inline">{isSearching ? "Searching" : "Search"}</span>
          <span className="sr-only sm:hidden">Search</span>
        </button>
      </div>
      {hint && <p className="mt-2 pl-5 text-sm text-brand">{hint}</p>}
    </form>
  );
}
