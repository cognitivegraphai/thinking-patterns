#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface BipartiteInput {
  pros: string[];
  cons: string[];
  edges: [string, string][];
  weights?: Record<string, number>;
}

class BipartiteServer {
  public processBipartite(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as BipartiteInput;
      if (!Array.isArray(data.pros)) {
        throw new Error('Invalid pros: must be an array of strings');
      }
      if (!Array.isArray(data.cons)) {
        throw new Error('Invalid cons: must be an array of strings');
      }
      if (!Array.isArray(data.edges) || !data.edges.every(e => Array.isArray(e) && e.length === 2)) {
        throw new Error('Invalid edges: must be an array of [factor, decision] pairs');
      }
      if (data.weights && typeof data.weights !== 'object') {
        throw new Error('Invalid weights: must be an object');
      }
      const weights = data.weights || {};
      const proScore = data.pros.reduce((sum, p) => sum + (weights[p] || 1), 0);
      const conScore = data.cons.reduce((sum, c) => sum + (weights[c] || 1), 0);
      const result = {
        pros: data.pros,
        cons: data.cons,
        edges: data.edges,
        weights,
        weightedScore: proScore - conScore
      };
      const output = chalk.redBright(`Bipartite Graph Reasoning\nPros: ${result.pros.join(', ')}\nCons: ${result.cons.join(', ')}\nWeighted Score: ${result.weightedScore}`);
      console.error(output);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

const BIPARTITE_GRAPH_TOOL: Tool = {
  name: "bipartite_graph_reasoning",
  description: `A tool for pro-con analysis using bipartite graphs.\n- pros: Pro factors\n- cons: Con factors\n- edges: Links from pros/cons to the decision as [factor, decision] pairs\n- weights: Importance weights for each factor`,
  inputSchema: {
    type: "object",
    properties: {
      pros: { type: "array", items: { type: "string" } },
      cons: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      weights: { type: "object" }
    },
    required: ["pros", "cons", "edges"]
  },
  outputSchema: {
    type: "object",
    properties: {
      pros: { type: "array", items: { type: "string" } },
      cons: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      weights: { type: "object" },
      weightedScore: { type: "number" }
    },
    required: ["pros", "cons", "edges", "weights", "weightedScore"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [BIPARTITE_GRAPH_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const bipartiteServer = new BipartiteServer();
      if (toolName === "bipartite_graph_reasoning") {
        return bipartiteServer.processBipartite(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [BIPARTITE_GRAPH_TOOL],
  });
  await server.start();
}

runServer(); 