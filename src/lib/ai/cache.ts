const CACHE_TTL_MS = 45_000;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const aiCache = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
  const entry = aiCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    aiCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  aiCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
