import { generate } from '../ollama/client.js';
import { SYSTEM_PROMPTS, TASK_PROMPTS } from '../ollama/prompts.js';
import { validateJson, withRetry } from '../utils/helpers.js';
import { logMetric, estimateClaudeTokens } from '../utils/metrics.js';
import { fileCache } from '../cache/index.js';
import { stat } from 'fs/promises';

export const summarizeTool = {
  name: 'local_summarize',
  description:
    'Generate compressed structural summaries of source files. Returns purpose, exports, imports, and key functions in ~15 lines instead of the full file. Use for exploration before deciding which files to read fully.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Absolute paths to files to summarize',
      },
      depth: {
        type: 'string',
        enum: ['standard', 'detailed'],
        description:
          'standard: purpose/exports/imports/functions. detailed: adds type definitions, component props, full signatures. Default: standard',
      },
    },
    required: ['files'],
  },
};

interface SummarizeParams {
  files: string[];
  depth?: 'standard' | 'detailed';
}

// In-memory summary cache: key = "filepath:mtimeMs", value = cached summary
interface CachedSummary {
  summary: Record<string, unknown>;
  cachedAt: number;
}

const summaryCache = new Map<string, CachedSummary>();
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get file mtime for cache key generation
 */
async function getFileMtime(filepath: string): Promise<number | null> {
  try {
    const s = await stat(filepath);
    return s.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Regex-based fallback when Ollama is unavailable.
 * Extracts structural info without any AI model.
 */
function regexFallback(content: string, filepath: string): Record<string, unknown> {
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Extract imports
  const imports: string[] = [];
  for (const line of lines) {
    const match = line.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/);
    if (match) {
      imports.push(match[1]);
    }
  }

  // Extract exports
  const exports: string[] = [];
  for (const line of lines) {
    const namedExport = line.match(
      /^export\s+(?:const|function|class|type|interface|enum|default)\s+(\w+)/,
    );
    if (namedExport) {
      exports.push(namedExport[1]);
    }
  }

  // Infer file type from extension
  const ext = filepath.split('.').pop() || 'unknown';
  const typeMap: Record<string, string> = {
    ts: 'TypeScript module',
    tsx: 'React component',
    js: 'JavaScript module',
    jsx: 'React component',
    json: 'JSON config',
    css: 'Stylesheet',
    md: 'Documentation',
  };

  return {
    purpose: `${typeMap[ext] || 'Source file'} (AI summary unavailable — regex fallback)`,
    lines: lineCount,
    exports,
    imports,
    key_functions: [],
    _fallback: true,
  };
}

export async function summarizeHandler(params: SummarizeParams) {
  const { files, depth = 'standard' } = params;
  const summaries: Record<string, Record<string, unknown>> = {};
  let totalTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;
  const startTime = Date.now();
  let hasErrors = false;
  let cacheHits = 0;

  for (const filepath of files) {
    try {
      // Read file content
      const content = await fileCache.get(filepath);
      const lineCount = content.split('\n').length;
      totalInputChars += content.length;

      // Check summary cache by filepath + mtime
      const mtime = await getFileMtime(filepath);
      const cacheKey = `${filepath}:${mtime}:${depth}`;
      const cached = summaryCache.get(cacheKey);

      if (cached && Date.now() - cached.cachedAt < SUMMARY_CACHE_TTL_MS) {
        summaries[filepath] = cached.summary;
        cacheHits++;
        continue;
      }

      // Try AI summary via local Ollama
      try {
        const result = await withRetry(
          async () => {
            const prompt = TASK_PROMPTS.summarizeFile(content, filepath, depth);
            const { response, tokensUsed } = await generate({
              system: SYSTEM_PROMPTS.summarize,
              prompt,
              format: 'json',
            });
            totalTokens += tokensUsed;
            totalOutputChars += response.length;

            const parsed = validateJson(response);
            if (!parsed.valid) {
              throw new Error(`Invalid JSON: ${parsed.error}`);
            }
            return parsed.data;
          },
          1, // Only 1 retry for summarize — speed matters
        );

        // Ensure line count is accurate (model might get it wrong)
        result.lines = lineCount;

        summaries[filepath] = result;

        // Cache the result
        summaryCache.set(cacheKey, {
          summary: result,
          cachedAt: Date.now(),
        });
      } catch {
        // Ollama failed — use regex fallback
        const fallback = regexFallback(content, filepath);
        summaries[filepath] = fallback;

        // Still cache the fallback (better than nothing)
        summaryCache.set(cacheKey, {
          summary: fallback,
          cachedAt: Date.now(),
        });
      }
    } catch (error) {
      hasErrors = true;
      summaries[filepath] = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Evict stale cache entries periodically (keep cache bounded)
  if (summaryCache.size > 100) {
    const now = Date.now();
    for (const [key, val] of summaryCache) {
      if (now - val.cachedAt > SUMMARY_CACHE_TTL_MS) {
        summaryCache.delete(key);
      }
    }
  }

  // Log metrics
  const estimatedClaude = estimateClaudeTokens({
    inputChars: totalInputChars,
    outputChars: totalOutputChars,
    taskComplexity: 'low', // Summarization is structural extraction
  });

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: 'local_summarize',
    task_type: depth,
    local_tokens: totalTokens,
    estimated_claude_tokens: estimatedClaude,
    duration_ms: Date.now() - startTime,
    success: !hasErrors,
    files_processed: files.length,
  }).catch(() => {});

  return {
    success: true,
    data: summaries,
    cache_hits: cacheHits,
    files_summarized: files.length,
    tokens_used: totalTokens,
  };
}
