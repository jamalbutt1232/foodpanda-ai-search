import { describe, expect, it } from "vitest";
import { TTLCache } from "@/lib/cache";
import { clientKey, RateLimiter } from "@/lib/rateLimit";
import { normalizeQuery } from "@/lib/search/normalizeQuery";

describe("TTLCache", () => {
  it("expires entries after the TTL", () => {
    let now = 0;
    const cache = new TTLCache<string>(1000, 10, () => now);
    cache.set("a", "x");
    expect(cache.get("a")).toBe("x");
    now = 1001;
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the least recently used entry", () => {
    const cache = new TTLCache<number>(10_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
  });
});

describe("normalizeQuery", () => {
  it("makes equivalent queries share a cache key", () => {
    expect(normalizeQuery("  Air   Fried FRIES!  ")).toBe(normalizeQuery("air fried fries"));
  });
});

describe("RateLimiter", () => {
  it("allows 20 per minute per key, then blocks with Retry-After", () => {
    let now = 0;
    const limiter = new RateLimiter(20, 60_000, () => now);
    for (let i = 0; i < 20; i++) expect(limiter.check("ip").allowed).toBe(true);
    const blocked = limiter.check("ip");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(60);
    expect(limiter.check("other-ip").allowed).toBe(true);
    now = 60_001;
    expect(limiter.check("ip").allowed).toBe(true);
  });

  it("reads the client IP from proxy headers", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKey(new Headers())).toBe("local");
  });
});
