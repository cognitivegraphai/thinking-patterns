# Decomposition MCP Server

A Model Context Protocol (MCP) server for breaking down complex problems into manageable components.

## Overview

The Decomposition MCP server provides tools for analyzing problems through a structured decomposition process that identifies components, dependencies, and relationships. It helps in breaking down complex systems or problems into smaller, manageable parts, identifying dependencies between components, and planning implementation strategies.

## Installation

```bash
npm install @modelcontextprotocol/server-decomposition
```

## Usage

### Starting the Server

You can start the server using the provided binary:

```bash
npx mcp-server-decomposition
```

Or run it directly from the source:

```bash
node dist/index.js
```

### Environment Variables

- `DECOMPOSITION_STATE_FILE_PATH`: Path to the state file (default: `decomposition-state.json` in the same directory as the script)
- `DISABLE_DECOMPOSITION_LOGGING`: Set to "true" to disable console logging (default: false)

## Tool Schema

The server exposes a single tool named `decomposition` with the following actions:

### Actions

- `createProblem`: Create a new problem definition
- `updateProblem`: Update an existing problem
- `createComponent`: Create a new component for a problem
- `updateComponent`: Update an existing component
- `linkComponents`: Create a dependency relationship between components
- `startPhase`: Start a new decomposition phase
- `completePhase`: Complete a decomposition phase and calculate metrics
- `calculateMetrics`: Calculate metrics for a problem's decomposition
- `getDecomposition`: Get all components for a problem
- `getComponentDetails`: Get details for a specific component
- `getProblemDetails`: Get details for a specific problem
- `getPhaseHistory`: Get the history of decomposition phases

### Examples

#### Creating a Problem

```json
{
  "action": "createProblem",
  "problemData": {
    "problemId": "p1",
    "problemStatement": "Build a scalable e-commerce platform",
    "complexity": 8,
    "domain": "Web Development",
    "constraints": ["Must support mobile devices", "Must handle 10,000 concurrent users"]
  }
}
```

#### Creating a Component

```json
{
  "action": "createComponent",
  "componentData": {
    "componentId": "c1",
    "parentProblemId": "p1",
    "name": "User Authentication Service",
    "description": "Handles user registration, login, and session management",
    "dependencies": [],
    "status": "pending",
    "complexity": 6
  }
}
```

#### Linking Components

```json
{
  "action": "linkComponents",
  "sourceId": "c2",
  "targetId": "c1"
}
```

#### Getting Decomposition

```json
{
  "action": "getDecomposition",
  "problemId": "p1"
}
```

## Metrics

The server calculates the following metrics for a problem's decomposition:

- `componentCount`: Total number of components
- `averageComplexity`: Average complexity of all components
- `maxDepth`: Maximum depth of the dependency graph
- `dependencyCount`: Total number of dependencies
- `balanceScore`: Score indicating how balanced the decomposition is (1-10)

## State Management

The server maintains state in a JSON file, which includes:

- Problems
- Components
- Decomposition phases
- Metrics

The state is automatically saved after each operation and can be persisted across server restarts.