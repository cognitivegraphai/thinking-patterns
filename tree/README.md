# Tree Reasoning MCP Server

An MCP server implementation that provides a tool for tree-structured (deductive/inductive) reasoning.

## Features

- Represent reasoning as a tree: root (general premise) to branches (specific conclusions/evidence)
- Traverse top-down (deduction) or bottom-up (induction)
- Revise or expand branches as new evidence or contradictions arise

## Tool

### tree_reasoning

Facilitates hierarchical reasoning using tree structures.

**Inputs:**
- `root` (string): The general premise or root of the tree
- `branches` (array of strings): Immediate branches (conclusions/evidence)
- `contradictions` (array of strings, optional): Contradictions or exceptions
- `traversal` (string, optional): 'top-down' or 'bottom-up'

## Usage

The Tree Reasoning tool is designed for:
- Deductive reasoning (from general to specific)
- Inductive reasoning (from specific to general)
- Revising reasoning when contradictions are found

## Configuration

(Configure as with other MCP servers, see sequentialthinking for details.)

## License

This MCP server is licensed under the MIT License. 