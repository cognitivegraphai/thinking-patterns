#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface DAGReasoningInput {
  nodes: string[];
  edges: [string, string][];
  traversal?: 'forward' | 'backward';
}

class DAGReasoningServer {
  public processDAG(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as DAGReasoningInput;
      if (!Array.isArray(data.nodes)) {
        throw new Error('Invalid nodes: must be an array of strings');
      }
      if (!Array.isArray(data.edges) || !data.edges.every(e => Array.isArray(e) && e.length === 2)) {
        throw new Error('Invalid edges: must be an array of [from, to] pairs');
      }
      if (data.traversal && data.traversal !== 'forward' && data.traversal !== 'backward') {
        throw new Error('Invalid traversal: must be "forward" or "backward"');
      }
      const dag = {
        nodes: data.nodes,
        edges: data.edges,
        traversal: data.traversal || 'forward',
      };
      const output = chalk.green(`DAG Reasoning\nNodes: ${dag.nodes.join(', ')}\nEdges: ${dag.edges.map(e => `${e[0]}->${e[1]}`).join(', ')}\nTraversal: ${dag.traversal}`);
      console.error(output);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(dag, null, 2)
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

const DAG_REASONING_TOOL: Tool = {
  name: "dag_reasoning",
  description: `A tool for causal reasoning using directed acyclic graphs (DAGs).\n- nodes: Events or variables\n- edges: Cause-effect relationships as [from, to] pairs\n- traversal: 'forward' or 'backward'`,
  inputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      traversal: { type: "string", enum: ["forward", "backward"] }
    },
    required: ["nodes", "edges"]
  },
  outputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      traversal: { type: "string" }
    },
    required: ["nodes", "edges", "traversal"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [DAG_REASONING_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const dagServer = new DAGReasoningServer();
      if (toolName === "dag_reasoning") {
        return dagServer.processDAG(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [DAG_REASONING_TOOL],
  });
  await server.start();
}

runServer(); 