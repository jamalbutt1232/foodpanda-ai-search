import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, serverError } from "@/lib/api/errors";
import { clientKey, searchRateLimiter } from "@/lib/rateLimit";
import { AreaNotFoundError, search } from "@/lib/search";
import { SEARCH_REQUEST_MODES } from "@/types/search";

const bodySchema = z.object({
  query: z.string().trim().min(3, "Query must be at least 3 characters").max(200),
  areaSlug: z.string().regex(/^[a-z0-9-]{1,50}$/, "Invalid area"),
  mode: z.enum(SEARCH_REQUEST_MODES, { message: 'Mode must be "ai" or "keyword"' }).default("ai"),
});

export async function POST(request: Request) {
  const limit = searchRateLimiter.check(clientKey(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid search request.", 400);
  }

  try {
    return NextResponse.json(await search(parsed.data));
  } catch (error) {
    if (error instanceof AreaNotFoundError) return jsonError("Unknown area.", 400);
    return serverError("POST /api/search", error);
  }
}
