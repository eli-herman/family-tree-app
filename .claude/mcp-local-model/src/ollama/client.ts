/**
 * Ollama API Client
 * Handles all communication with the local Ollama server
 */

import { ollamaCache } from "../cache/index.js";
import { config } from "../config.js";
import { remoteGenerate as remoteGenerateImpl } from "./remote.js";

export interface OllamaConfig {
  host: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface GenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: "json";
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      host: config.host || process.env.OLLAMA_HOST || "http://localhost:11434",
      model: config.model || process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",
      timeoutMs: config.timeoutMs || 30000,
      maxRetries: config.maxRetries || 2,
    };
  }

  async generate(prompt: string, jsonFormat = true): Promise<{
    text: string;
    tokensUsed: number;
    durationMs: number;
  }> {
    const request: GenerateRequest = {
      model: this.config.model,
      prompt,
      stream: false,
      ...(jsonFormat && { format: "json" }),
      options: {
        temperature: 0.1, // Low temperature for structured output
        num_predict: 2048,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          this.config.timeoutMs
        );

        const response = await fetch(`${this.config.host}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as OllamaResponse;

        return {
          text: data.response,
          tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
          durationMs: Math.round((data.total_duration || 0) / 1_000_000),
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw lastError || new Error("Unknown error in Ollama client");
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.host}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.host}/api/tags`);
      const data = await response.json();
      return (data.models || []).map((m: { name: string }) => m.name);
    } catch {
      return [];
    }
  }
}

export const ollamaClient = new OllamaClient();

/**
 * Convenience function for tool handlers
 * Takes system prompt, user prompt, and format - returns structured response
 * Uses caching when enabled to avoid redundant API calls
 */
export async function generate(params: {
  system: string;
  prompt: string;
  format?: "json";
}): Promise<{
  response: string;
  tokensUsed: number;
}> {
  // Check cache first if caching is enabled
  if (config.cache.enabled) {
    const cached = ollamaCache.get(params.system, params.prompt);
    if (cached) {
      return cached;
    }
  }

  const fullPrompt = `${params.system}\n\n${params.prompt}`;
  const result = await ollamaClient.generate(fullPrompt, params.format === "json");

  const response = {
    response: result.text,
    tokensUsed: result.tokensUsed,
  };

  // Cache the result if caching is enabled
  if (config.cache.enabled) {
    ollamaCache.set(params.system, params.prompt, response.response, response.tokensUsed);
  }

  return response;
}

/**
 * Convenience function for remote model generation
 * Uses the Quality Server on Windows PC (14B model)
 * Uses caching when enabled to avoid redundant API calls
 */
export async function generateRemote(params: {
  system: string;
  prompt: string;
  format?: "json";
}): Promise<{
  response: string;
  tokensUsed: number;
}> {
  // Check cache first if caching is enabled
  if (config.cache.enabled) {
    const cacheKey = `remote:${params.system}`;
    const cached = ollamaCache.get(cacheKey, params.prompt);
    if (cached) {
      return cached;
    }
  }

  const result = await remoteGenerateImpl({
    system: params.system,
    prompt: params.prompt,
    format: params.format,
  });

  const response = {
    response: result.response,
    tokensUsed: result.tokensUsed,
  };

  // Cache the result if caching is enabled
  if (config.cache.enabled) {
    const cacheKey = `remote:${params.system}`;
    ollamaCache.set(cacheKey, params.prompt, response.response, response.tokensUsed);
  }

  return response;
}
