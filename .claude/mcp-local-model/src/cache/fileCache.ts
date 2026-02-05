import { readFile, stat } from "fs/promises";

interface CacheEntry {
  content: string;
  mtime: number;
  accessTime: number;
}

interface FileCacheOptions {
  maxSize: number;
  ttlMs: number;
}

export class FileCache {
  private cache = new Map<string, CacheEntry>();
  private options: FileCacheOptions;

  constructor(options: FileCacheOptions) {
    this.options = options;
  }

  async get(filepath: string): Promise<string> {
    const entry = this.cache.get(filepath);
    const now = Date.now();

    if (entry) {
      // Check if TTL expired
      if (now - entry.accessTime > this.options.ttlMs) {
        this.cache.delete(filepath);
      } else {
        // Check if file was modified
        try {
          const stats = await stat(filepath);
          const mtime = stats.mtimeMs;

          if (mtime === entry.mtime) {
            // Update access time and return cached content
            entry.accessTime = now;
            return entry.content;
          }
          // File was modified, invalidate cache
          this.cache.delete(filepath);
        } catch {
          // File doesn't exist anymore, invalidate cache
          this.cache.delete(filepath);
        }
      }
    }

    // Read file and cache it
    const content = await readFile(filepath, "utf-8");
    const stats = await stat(filepath);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(filepath, {
      content,
      mtime: stats.mtimeMs,
      accessTime: now,
    });

    return content;
  }

  invalidate(filepath: string): void {
    this.cache.delete(filepath);
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; maxSize: number; entries: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [path, entry] of this.cache) {
      if (entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime;
        oldest = path;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    }
  }
}
