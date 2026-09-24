"use client";

import { useEffect, useState } from "react";
import type { SearchRequestMode, SearchResponse } from "@/types/search";

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: SearchResponse }
  | { status: "error"; message: string };

async function readError(response: Response): Promise<string> {
  if (response.status === 429) return "You're searching fast! Give it a few seconds and try again.";
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // fall through
  }
  return "Something went wrong. Please try again.";
}

/** Runs a search whenever query/area/mode change; cancels stale requests. */
export function useSearch(
  query: string,
  areaSlug: string,
  mode: SearchRequestMode,
  enabled = true,
): SearchState {
  const [state, setState] = useState<SearchState>({ status: "idle" });

  useEffect(() => {
    if (!enabled || query.trim().length < 3) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });

    fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, areaSlug, mode }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          setState({ status: "error", message: await readError(response) });
          return;
        }
        setState({ status: "success", data: (await response.json()) as SearchResponse });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({ status: "error", message: "Couldn't reach the server. Check your connection." });
      });

    return () => controller.abort();
  }, [query, areaSlug, mode, enabled]);

  return state;
}
