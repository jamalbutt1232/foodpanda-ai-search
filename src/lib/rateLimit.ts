export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the next request would be allowed (0 when allowed). */
  retryAfterSec: number;
}

/** Sliding-window limiter kept in memory, keyed by client (IP). */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const now = this.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const retryAfterMs = this.windowMs - (now - recent[0]);
      return { allowed: false, remaining: 0, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
    }

    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(now);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSec: 0 };
  }

  private prune(now: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
    }
  }
}

const g = globalThis as typeof globalThis & { __searchLimiter?: RateLimiter };
/** 20 searches per minute per IP. */
export const searchRateLimiter = (g.__searchLimiter ??= new RateLimiter(20, 60_000));

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "local";
}
