#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

interface TreeReasoningInput {
  root: string;
  branches: string[];
  contradictions?: string[];
  traversal?: 'top-down' | 'bottom-up';
}

class TreeReasoningServer {
  public processTree(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const data = input as TreeReasoningInput;
      if (!data.root || typeof data.root !== 'string') {
        throw new Error('Invalid root: must be a string');
      }
      if (!Array.isArray(data.branches)) {
        throw new Error('Invalid branches: must be an array of strings');
      }
      if (data.contradictions && !Array.isArray(data.contradictions)) {
        throw new Error('Invalid contradictions: must be an array of strings');
      }
      if (data.traversal && data.traversal !== 'top-down' && data.traversal !== 'bottom-up') {
        throw new Error('Invalid traversal: must be "top-down" or "bottom-up"');
      }
      const tree = {
        root: data.root,
        branches: data.branches,
        contradictions: data.contradictions || [],
        traversal: data.traversal || 'top-down',
      };
      const output = chalk.blue(`Tree Reasoning\nRoot: ${tree.root}\nBranches: ${tree.branches.join(', ')}\nContradictions: ${tree.contradictions.join(', ')}\nTraversal: ${tree.traversal}`);
      console.error(output);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(tree, null, 2)
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

const TREE_REASONING_TOOL: Tool = {
  name: "tree_reasoning",
  description: `A tool for hierarchical reasoning using tree structures.\n- root: The general premise\n- branches: Immediate conclusions or evidence\n- contradictions: Contradictions or exceptions\n- traversal: 'top-down' or 'bottom-up'`,
  inputSchema: {
    type: "object",
    properties: {
      root: { type: "string" },
      branches: { type: "array", items: { type: "string" } },
      contradictions: { type: "array", items: { type: "string" } },
      traversal: { type: "string", enum: ["top-down", "bottom-up"] }
    },
    required: ["root", "branches"]
  },
  outputSchema: {
    type: "object",
    properties: {
      root: { type: "string" },
      branches: { type: "array", items: { type: "string" } },
      contradictions: { type: "array", items: { type: "string" } },
      traversal: { type: "string" }
    },
    required: ["root", "branches", "contradictions", "traversal"]
  }
};

async function runServer() {
  const server = new Server({
    tools: [TREE_REASONING_TOOL],
    transport: new StdioServerTransport(),
    callTool: async (toolName, input) => {
      const treeServer = new TreeReasoningServer();
      if (toolName === "tree_reasoning") {
        return treeServer.processTree(input);
      }
      throw new Error(`Unknown tool: ${toolName}`);
    },
    listTools: async () => [TREE_REASONING_TOOL],
  });
  await server.start();
}

runServer(); 