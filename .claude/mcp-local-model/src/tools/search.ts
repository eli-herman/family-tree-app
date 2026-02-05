/**
 * Semantic Search Tool
 * Uses embeddings + ChromaDB on remote server for meaning-based code search
 */

import { remoteSearch, isRemoteAvailable } from "../ollama/remote.js";
import { events } from "../events.js";

export const searchTool = {
  name: "local_search",
  description: "Semantic search through codebase using embeddings. Finds code by meaning, not just keywords.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Natural language description of what you're looking for (e.g., 'authentication handling', 'database connection')",
      },
      collection: {
        type: "string",
        enum: ["codebase", "docs"],
        description: "Which collection to search (codebase for source code, docs for documentation)",
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

export async function searchHandler(params: SearchParams) {
  const { query, collection = "codebase", limit = 5 } = params;
  const startTime = Date.now();

  // Check if remote server is available
  const available = await isRemoteAvailable();
  if (!available) {
    return {
      success: false,
      error: "Remote server not available",
      suggestion: "Ensure the Quality Server is running on the Windows PC (192.168.1.190:4000)",
    };
  }

  try {
    events.routeDecision("semantic_search", "embeddings", "Vector similarity search");

    const results = await remoteSearch({
      query,
      collection,
      limit,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: {
        query,
        collection,
        results: results.map((r, i) => ({
          rank: i + 1,
          similarity: r.similarity.toFixed(3),
          file: r.metadata.path,
          content_preview: r.content.substring(0, 200) + (r.content.length > 200 ? "..." : ""),
          metadata: r.metadata,
        })),
        count: results.length,
      },
      duration_ms: duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
      suggestion: "Check remote server logs for details",
    };
  }
}
