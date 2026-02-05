import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { extractTool, extractHandler } from "./tools/extract.js";
import { verifyTool, verifyHandler } from "./tools/verify.js";
import { generateTool, generateHandler } from "./tools/generate.js";
import { gitTool, gitHandler } from "./tools/git.js";
import { analyzeTool, analyzeHandler } from "./tools/analyze.js";
import { metricsTool, metricsHandler } from "./tools/metrics.js";
import { searchTool, searchHandler } from "./tools/search.js";
import {
  reviewApproachTool,
  reviewApproachHandler,
  reviewCodeTool,
  reviewCodeHandler,
} from "./tools/review.js";
import { config } from "./config.js";
import { events } from "./events.js";

const server = new Server(
  {
    name: "local-model",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools
const tools = [
  extractTool,
  verifyTool,
  generateTool,
  gitTool,
  analyzeTool,
  metricsTool,
  searchTool,
  reviewApproachTool,
  reviewCodeTool,
];

const handlers: Record<string, (params: any) => Promise<any>> = {
  local_extract: extractHandler,
  local_verify: verifyHandler,
  local_generate: generateHandler,
  local_git: gitHandler,
  local_analyze: analyzeHandler,
  local_metrics: metricsHandler,
  local_search: searchHandler,
  local_review_approach: reviewApproachHandler,
  local_review_code: reviewCodeHandler,
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = handlers[name];
  if (!handler) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Unknown tool: ${name}`,
            error_category: "invalid_tool",
            recoverable: false,
            suggestion: "Check available tools with list_tools",
          }),
        },
      ],
    };
  }

  try {
    const result = await handler(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            error_category: "execution_error",
            recoverable: true,
            suggestion: "Retry or handle directly",
          }),
        },
      ],
    };
  }
});

// Start server
async function main() {
  // Start dashboard WebSocket server if enabled
  if (config.dashboard?.enabled) {
    events.start(config.dashboard.wsPort);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Local Model MCP Server running`);
  console.error(`  Local model: ${config.ollama.model}`);
  console.error(`  Remote server: ${config.remote?.host || 'not configured'}`);
  console.error(`  Dashboard WebSocket: ${config.dashboard?.enabled ? `ws://localhost:${config.dashboard.wsPort}` : 'disabled'}`);
}

main().catch(console.error);
