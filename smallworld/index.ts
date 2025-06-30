#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface SmallWorldInput {
  nodes: string[];
  edges: [string, string][];
  startNode?: string;
  endNode?: string;
}

function findShortcutPath(nodes: string[], edges: [string, string][], start?: string, end?: string): string[] {
  if (!start || !end) return [];
  const graph: Record<string, string[]> = {};
  for (const node of nodes) graph[node] = [];
  for (const [from, to] of edges) graph[from].push(to);
  const queue: [string, string[]][] = [[start, [start]]];
  const visited: Record<string, boolean> = { [start]: true };
  while (queue.length) {
    const [current, path] = queue.shift()!;
    if (current === end) return path;
    for (const neighbor of graph[current]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  return [];
}

class SmallWorldServer {
  public processSmallWorld(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as SmallWorldInput;
      if (!Array.isArray(data.nodes)) {
        throw new Error('Invalid nodes: must be an array of strings');
      }
      if (!Array.isArray(data.edges) || !data.edges.every(e => Array.isArray(e) && e.length === 2)) {
        throw new Error('Invalid edges: must be an array of [from, to] pairs');
      }
      const path = findShortcutPath(data.nodes, data.edges, data.startNode, data.endNode);
      const result = {
        nodes: data.nodes,
        edges: data.edges,
        startNode: data.startNode || null,
        endNode: data.endNode || null,
        shortcutPath: path
      };
      const output = chalk.blueBright(`Small-World Network Reasoning\nStart: ${result.startNode}\nEnd: ${result.endNode}\nShortcut Path: ${result.shortcutPath.join(' -> ')}`);
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

const SMALLWORLD_NETWORK_TOOL: Tool = {
  name: "smallworld_network_reasoning",
  description: `A tool for heuristic shortcut reasoning using small-world networks.\n- nodes: Concepts or states\n- edges: Connections as [from, to] pairs\n- startNode: Node to begin traversal\n- endNode: Target node for shortcut`,
  inputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      startNode: { type: "string" },
      endNode: { type: "string" }
    },
    required: ["nodes", "edges"]
  },
  outputSchema: {
    type: "object",
    properties: {
      nodes: { type: "array", items: { type: "string" } },
      edges: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
      startNode: { type: ["string", "null"] },
      endNode: { type: ["string", "null"] },
      shortcutPath: { type: "array", items: { type: "string" } }
    },
    required: ["nodes", "edges", "startNode", "endNode", "shortcutPath"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [SMALLWORLD_NETWORK_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const smallworldServer = new SmallWorldServer();
      if (toolName === "smallworld_network_reasoning") {
        return smallworldServer.processSmallWorld(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [SMALLWORLD_NETWORK_TOOL],
  });
  await server.start();
}

runServer(); 