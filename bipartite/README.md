# Bipartite Graph Reasoning MCP Server

An MCP server implementation that provides a tool for pro-con analysis using bipartite graphs.

## Features

- Represent two sets of nodes (e.g., pros and cons) and their links to a decision
- Weigh the importance of each factor
- Visualize and analyze trade-offs in decision-making

## Tool

### bipartite_graph_reasoning

Facilitates pro-con analysis using bipartite graph structures.

**Inputs:**
- `pros` (array of strings): Pro factors
- `cons` (array of strings): Con factors
- `edges` (array of [factor, decision] pairs): Links from pros/cons to the decision
- `weights` (object, optional): Importance weights for each factor

## Usage

The Bipartite Graph Reasoning tool is designed for:
- Analyzing trade-offs in decisions
- Weighing pros and cons
- Structuring decision analysis

## Configuration

(Configure as with other MCP servers, see sequentialthinking for details.)

## License

This MCP server is licensed under the MIT License. 