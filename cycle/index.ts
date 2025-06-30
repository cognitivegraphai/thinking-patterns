#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface CycleDetectionInput {
  nodes: string[];
  edges: [string, string][];
}

function detectCycle(nodes: string[], edges: [string, string][]): { hasCycle: boolean; cyclePath: string[] } {
  const graph: Record<string, string[]> = {};
  for (const node of nodes) graph[node] = [];
  for (const [from, to] of edges) graph[from].push(to);
  const visited: Record<string, boolean> = {};
  const stack: Record<string, boolean> = {};
  const path: string[] = [];
  function dfs(node: string): boolean {
    visited[node] = true;
    stack[node] = true;
    path.push(node);
    for (const neighbor of graph[node]) {
      if (!visited[neighbor] && dfs(neighbor)) return true;
      if (stack[neighbor]) {
        path.push(neighbor);
        return true;
      }
    }
    stack[node] = false;
    path.pop();
    return false;
  }
  for (const node of nodes) {
    if (!visited[node] && dfs(node)) {
      const cycleStart = path.lastIndexOf(path[path.length - 1]);
      return { hasCycle: true, cyclePath: path.slice(cycleStart) };
    }
  }
  return { hasCycle: false, cyclePath: [] };
}

class CycleDetectionServer {
  public processCycle(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as CycleDetectionInput;
      if (!Array.isArray(data.nodes)) {
        throw new Error('Invalid nodes: must be an array of strings');
      }
      if (!Array.isArray(data.edges) || !data.edges.every(e => Array.isArray(e) && e.length === 2)) {
        throw new Error('Invalid edges: must be an array of [from, to] pairs');
      }
      const result = detectCycle(data.nodes, data.edges);
      const output = chalk.yellow(`Cycle Detection\nHas Cycle: ${result.hasCycle}\nCycle Path: ${result.cyclePath.join(' -> ')}`);
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

const CYCLE_DETECTION_TOOL: Tool = {
  name: "cycle_detection",
  description: `A tool for detecting cycles in a directed graph of reasoning steps.\n- nodes: Reasoning steps or concepts\n- edges: Directed relationships as [from, to] pairs`,
  inputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } }
    },
    required: ["nodes", "edges"]
  },
  outputSchema: {
    type: "object",
    properties: {
      hasCycle: { type: "boolean" },
      cyclePath: { type: "array", items: { type: "string" } }
    },
    required: ["hasCycle", "cyclePath"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [CYCLE_DETECTION_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const cycleServer = new CycleDetectionServer();
      if (toolName === "cycle_detection") {
        return cycleServer.processCycle(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [CYCLE_DETECTION_TOOL],
  });
  await server.start();
}

runServer(); 