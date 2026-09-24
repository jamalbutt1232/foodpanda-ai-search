/** Small in-memory TTL cache with LRU eviction. Per server process; fine for a local demo. */
export class TTLCache<V> {
  private readonly store = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

/** One instance per name, surviving Next.js dev hot reloads. */
export function sharedCache<V>(name: string, ttlMs: number, maxEntries?: number): TTLCache<V> {
  const g = globalThis as typeof globalThis & { __caches?: Map<string, TTLCache<unknown>> };
  g.__caches ??= new Map();
  let cache = g.__caches.get(name) as TTLCache<V> | undefined;
  if (!cache) {
    cache = new TTLCache<V>(ttlMs, maxEntries);
    g.__caches.set(name, cache as TTLCache<unknown>);
  }
  return cache;
}
