#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface BayesianNetworkInput {
  nodes: string[];
  edges: [string, string][];
  evidence?: Record<string, string | number | boolean>;
}

class BayesianNetworkServer {
  public processBayesian(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as BayesianNetworkInput;
      if (!Array.isArray(data.nodes)) {
        throw new Error('Invalid nodes: must be an array of strings');
      }
      if (!Array.isArray(data.edges) || !data.edges.every(e => Array.isArray(e) && e.length === 2)) {
        throw new Error('Invalid edges: must be an array of [from, to] pairs');
      }
      if (data.evidence && typeof data.evidence !== 'object') {
        throw new Error('Invalid evidence: must be an object');
      }
      const bayesian = {
        nodes: data.nodes,
        edges: data.edges,
        evidence: data.evidence || {},
      };
      const output = chalk.cyan(`Bayesian Network Reasoning\nNodes: ${bayesian.nodes.join(', ')}\nEdges: ${bayesian.edges.map(e => `${e[0]}->${e[1]}`).join(', ')}\nEvidence: ${JSON.stringify(bayesian.evidence)}`);
      console.error(output);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(bayesian, null, 2)
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

const BAYESIAN_NETWORK_TOOL: Tool = {
  name: "bayesian_network_reasoning",
  description: `A tool for probabilistic reasoning using Bayesian networks.\n- nodes: Variables\n- edges: Conditional dependencies as [from, to] pairs\n- evidence: Observed values for variables`,
  inputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      evidence: { type: "object" }
    },
    required: ["nodes", "edges"]
  },
  outputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      evidence: { type: "object" }
    },
    required: ["nodes", "edges", "evidence"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [BAYESIAN_NETWORK_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const bayesianServer = new BayesianNetworkServer();
      if (toolName === "bayesian_network_reasoning") {
        return bayesianServer.processBayesian(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [BAYESIAN_NETWORK_TOOL],
  });
  await server.start();
}

runServer(); 