import { createHash } from "crypto";

interface CacheEntry {
  response: string;
  tokensUsed: number;
  timestamp: number;
}

interface OllamaCacheOptions {
  maxSize: number;
  ttlMs: number;
}

export class OllamaCache {
  private cache = new Map<string, CacheEntry>();
  private options: OllamaCacheOptions;

  constructor(options: OllamaCacheOptions) {
    this.options = options;
  }

  private getKey(system: string, prompt: string): string {
    const hash = createHash("sha256");
    hash.update(system);
    hash.update(prompt);
    return hash.digest("hex");
  }

  get(system: string, prompt: string): { response: string; tokensUsed: number } | null {
    const key = this.getKey(system, prompt);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if TTL expired
    if (now - entry.timestamp > this.options.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return {
      response: entry.response,
      tokensUsed: entry.tokensUsed,
    };
  }

  set(system: string, prompt: string, response: string, tokensUsed: number): void {
    const key = this.getKey(system, prompt);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      response,
      tokensUsed,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      ttlMs: this.options.ttlMs,
    };
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    }
  }
}
