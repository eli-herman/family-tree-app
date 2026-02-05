export const config = {
  // Local Ollama (7B model on Mac)
  ollama: {
    host: process.env.OLLAMA_HOST || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",
    timeoutMs: 30000,
    maxRetries: 2,
  },

  // Remote Quality Server (14B model on Windows PC)
  remote: {
    host: process.env.REMOTE_HOST || "http://192.168.1.190:4000",
    model: "qwen2.5-coder:14b-q4_K_M",
    timeoutMs: 60000,
    wsPort: 4001,
  },

  // Task routing configuration
  routing: {
    complexityThreshold: 0.7,  // Above this → route to remote 14B
    enableFallback: true,      // Fall back to local if remote fails
  },

  // Dashboard WebSocket
  dashboard: {
    enabled: process.env.DASHBOARD_ENABLED !== "false",
    wsPort: 3334,
  },

  validation: {
    confidenceThreshold: 0.7,
    strictSchema: true,
  },
  templatesDir: "./templates",
  cache: {
    enabled: process.env.CACHE_ENABLED !== "false",
    fileMaxSize: 100,
    fileTtlMs: 60000,      // 1 minute
    ollamaMaxSize: 500,
    ollamaTtlMs: 300000,   // 5 minutes
  },
};

/**
 * Validate config on startup. Logs warnings for issues, never throws.
 */
export function validateConfig(): string[] {
  const warnings: string[] = [];

  // Validate URLs are well-formed
  try {
    new URL(config.ollama.host);
  } catch {
    warnings.push(`Invalid ollama.host URL: ${config.ollama.host}`);
  }

  if (config.remote?.host) {
    try {
      new URL(config.remote.host);
    } catch {
      warnings.push(`Invalid remote.host URL: ${config.remote.host}`);
    }
  }

  // Validate numeric ranges
  if (config.ollama.timeoutMs <= 0 || config.ollama.timeoutMs > 120000) {
    warnings.push(`ollama.timeoutMs out of range (1-120000): ${config.ollama.timeoutMs}`);
  }

  if (config.routing.complexityThreshold < 0 || config.routing.complexityThreshold > 1) {
    warnings.push(`routing.complexityThreshold out of range (0-1): ${config.routing.complexityThreshold}`);
  }

  if (config.cache.fileMaxSize <= 0) {
    warnings.push(`cache.fileMaxSize must be positive: ${config.cache.fileMaxSize}`);
  }

  if (config.cache.ollamaMaxSize <= 0) {
    warnings.push(`cache.ollamaMaxSize must be positive: ${config.cache.ollamaMaxSize}`);
  }

  return warnings;
}
