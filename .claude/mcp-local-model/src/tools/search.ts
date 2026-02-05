/**
 * Semantic Search Tool
 * Uses embeddings + ChromaDB on remote server for meaning-based code search.
 * Falls back to local grep-based search when remote is unavailable.
 */

import { execSync } from "child_process";
import { remoteSearch, isRemoteAvailable } from "../ollama/remote.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { events } from "../events.js";

const EXEC_TIMEOUT = 15_000;

export const searchTool = {
  name: "local_search",
  description:
    "Search through codebase by meaning. Uses semantic embeddings when remote server is available, falls back to keyword grep when offline.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description:
          "Natural language description of what you're looking for (e.g., 'authentication handling', 'database connection')",
      },
      collection: {
        type: "string",
        enum: ["codebase", "docs"],
        description:
          "Which collection to search (codebase for source code, docs for documentation)",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 5)",
      },
    },
    required: ["query"],
  },
};

interface SearchParams {
  query: string;
  collection?: "codebase" | "docs";
  limit?: number;
}

/**
 * Local grep-based fallback when remote ChromaDB is unavailable.
 * Extracts keywords from the query and searches files.
 */
function localGrepFallback(
  query: string,
  collection: string,
  limit: number
): Array<{ file: string; line: number; content: string; relevance: string }> {
  // Extract meaningful keywords (remove stop words)
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "may", "might", "must", "can", "could", "of", "in", "to",
    "for", "with", "on", "at", "from", "by", "about", "as", "into",
    "through", "during", "before", "after", "above", "below", "between",
    "how", "what", "where", "when", "who", "which", "that", "this",
    "it", "its", "and", "or", "but", "not", "no", "so", "if", "then",
  ]);

  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (keywords.length === 0) {
    return [];
  }

  let repoRoot: string;
  try {
    repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT,
    }).trim();
  } catch {
    return [];
  }

  const searchDir =
    collection === "docs"
      ? `${repoRoot}/.claude`
      : `${repoRoot}/src ${repoRoot}/app`;

  const includes =
    collection === "docs"
      ? '--include="*.md"'
      : '--include="*.ts" --include="*.tsx" --include="*.js"';

  const results: Array<{
    file: string;
    line: number;
    content: string;
    relevance: string;
  }> = [];
  const seen = new Set<string>();

  for (const keyword of keywords.slice(0, 5)) {
    try {
      const grepOutput = execSync(
        `grep -rn -i ${includes} "${keyword}" ${searchDir} 2>/dev/null | head -${limit * 2}`,
        {
          encoding: "utf-8",
          timeout: EXEC_TIMEOUT,
          maxBuffer: 512 * 1024,
        }
      ).trim();

      if (!grepOutput) continue;

      for (const line of grepOutput.split("\n")) {
        if (results.length >= limit) break;

        const match = line.match(/^(.+?):(\d+):(.+)$/);
        if (!match) continue;

        const [, file, lineNum, content] = match;
        const key = `${file}:${lineNum}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          file: file.replace(repoRoot + "/", ""),
          line: parseInt(lineNum, 10),
          content: content.trim().substring(0, 200),
          relevance: `keyword: ${keyword}`,
        });
      }
    } catch {
      // grep failure for this keyword - continue with next
    }
  }

  return results.slice(0, limit);
}

export async function searchHandler(params: SearchParams) {
  const { query, collection = "codebase", limit = 5 } = params;
  const startTime = Date.now();

  // Try remote semantic search first
  const available = await isRemoteAvailable();

  if (available) {
    try {
      events.routeDecision("semantic_search", "embeddings", "Vector similarity search");

      const results = await remoteSearch({ query, collection, limit });
      const duration = Date.now() - startTime;

      await logMetric({
        timestamp: new Date().toISOString(),
        tool: "local_search",
        task_type: "semantic",
        local_tokens: 0,
        estimated_claude_tokens: estimateClaudeTokens({
          inputChars: query.length,
          outputChars: JSON.stringify(results).length,
          taskComplexity: "medium",
        }),
        duration_ms: duration,
        success: true,
      }).catch(() => {});

      return {
        success: true,
        data: {
          query,
          collection,
          mode: "semantic",
          results: results.map((r, i) => ({
            rank: i + 1,
            similarity: r.similarity.toFixed(3),
            file: r.metadata.path,
            content_preview:
              r.content.substring(0, 200) +
              (r.content.length > 200 ? "..." : ""),
            metadata: r.metadata,
          })),
          count: results.length,
        },
        duration_ms: duration,
      };
    } catch (error) {
      // Remote failed - fall through to local fallback
      events.modelError(
        "embeddings",
        error instanceof Error ? error.message : "Search failed"
      );
    }
  }

  // Local grep-based fallback
  events.routeDecision(
    "keyword_search",
    "local",
    available
      ? "Remote search failed, using local grep fallback"
      : "Remote unavailable, using local grep fallback"
  );

  const results = localGrepFallback(query, collection, limit);
  const duration = Date.now() - startTime;

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_search",
    task_type: "grep_fallback",
    local_tokens: 0,
    estimated_claude_tokens: estimateClaudeTokens({
      inputChars: query.length,
      outputChars: JSON.stringify(results).length,
      taskComplexity: "low",
    }),
    duration_ms: duration,
    success: results.length > 0,
  }).catch(() => {});

  return {
    success: true,
    data: {
      query,
      collection,
      mode: "keyword_fallback",
      note: available
        ? "Remote semantic search failed; showing keyword results"
        : "Remote server unavailable; showing keyword results. Start Windows PC for semantic search.",
      results: results.map((r, i) => ({
        rank: i + 1,
        file: r.file,
        line: r.line,
        content_preview: r.content,
        relevance: r.relevance,
      })),
      count: results.length,
    },
    duration_ms: duration,
  };
}
