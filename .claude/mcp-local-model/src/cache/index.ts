import { config } from "../config.js";
import { events } from "../events.js";
import { FileCache } from "./fileCache.js";
import { OllamaCache } from "./ollamaCache.js";

export const fileCache = new FileCache({
  maxSize: config.cache.fileMaxSize,
  ttlMs: config.cache.fileTtlMs,
  onHit: (key) => events.cacheHit(`file:${key}`),
  onMiss: (key) => events.cacheMiss(`file:${key}`),
});

export const ollamaCache = new OllamaCache({
  maxSize: config.cache.ollamaMaxSize,
  ttlMs: config.cache.ollamaTtlMs,
  onHit: (key) => events.cacheHit(`ollama:${key}`),
  onMiss: (key) => events.cacheMiss(`ollama:${key}`),
});

export { FileCache } from "./fileCache.js";
export { OllamaCache } from "./ollamaCache.js";
