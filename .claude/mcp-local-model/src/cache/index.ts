import { config } from "../config.js";
import { FileCache } from "./fileCache.js";
import { OllamaCache } from "./ollamaCache.js";

export const fileCache = new FileCache({
  maxSize: config.cache.fileMaxSize,
  ttlMs: config.cache.fileTtlMs,
});

export const ollamaCache = new OllamaCache({
  maxSize: config.cache.ollamaMaxSize,
  ttlMs: config.cache.ollamaTtlMs,
});

export { FileCache } from "./fileCache.js";
export { OllamaCache } from "./ollamaCache.js";
