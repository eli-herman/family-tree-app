export const config = {
  // Local Ollama (7B model on Mac)
  ollama: {
    host: process.env.OLLAMA_HOST || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",
    timeoutMs: 30000,
    maxRetries: 2,
  },

  // Remote Quality Server (14B model on Windows PC - fits 8GB VRAM)
  remote: {
    host: process.env.REMOTE_HOST || "http://192.168.1.190:4000",
    model: "qwen2.5-coder:14b-q4_K_M",
    timeoutMs: 60000,
    wsPort: 4001,
  },

  // Task routing configuration
  routing: {
    complexityThreshold: 0.7,  // Above this → remote 32B
    enableFallback: true,
    preferQuality: false,      // Bias toward 32B
    preferSpeed: false,        // Bias toward 7B
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
