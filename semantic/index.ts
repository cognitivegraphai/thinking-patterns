#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface SemanticNetworkInput {
  nodes: string[];
  edges: [string, string, string][];
  startNode?: string;
}

class SemanticNetworkServer {
  public processNetwork(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as SemanticNetworkInput;
      if (!Array.isArray(data.nodes)) {
        throw new Error('Invalid nodes: must be an array of strings');
      }
      if (!Array.isArray(data.edges) || !data.edges.every(e => Array.isArray(e) && e.length === 3)) {
        throw new Error('Invalid edges: must be an array of [from, relation, to] triples');
      }
      const network = {
        nodes: data.nodes,
        edges: data.edges,
        activated: data.startNode || null,
      };
      const output = chalk.magenta(`Semantic Network Reasoning\nNodes: ${network.nodes.join(', ')}\nEdges: ${network.edges.map(e => `${e[0]}-${e[1]}->${e[2]}`).join(', ')}\nActivated: ${network.activated}`);
      console.error(output);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(network, null, 2)
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

const SEMANTIC_NETWORK_TOOL: Tool = {
  name: "semantic_network_reasoning",
  description: `A tool for associative reasoning using semantic networks.\n- nodes: Concepts\n- edges: Relationships as [from, relation, to] triples\n- startNode: Node to activate for spreading`,
  inputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } },
      startNode: { type: "string" }
    },
    required: ["nodes", "edges"]
  },
  outputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } },
      activated: { type: ["string", "null"] }
    },
    required: ["nodes", "edges", "activated"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [SEMANTIC_NETWORK_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const semanticServer = new SemanticNetworkServer();
      if (toolName === "semantic_network_reasoning") {
        return semanticServer.processNetwork(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [SEMANTIC_NETWORK_TOOL],
  });
  await server.start();
}

runServer(); 