# Branching Exploration MCP Server

An MCP server for exploring multiple pathways or scenarios from a single point, similar to a Tree-of-Thoughts approach.

## Overview

The Branching Exploration server provides a structured approach to exploring different possibilities and outcomes through a tree-like structure of branches. This is particularly useful for:

- Exploring different possible solutions to a problem
- Analyzing "what-if" scenarios and their consequences
- Decision-making with multiple possible outcomes
- Planning for contingencies and alternative paths
- Exploring the implications of different assumptions
- Mapping out complex solution spaces
- Identifying optimal paths through a decision tree

## Features

- Create scenarios with initial conditions and objectives
- Branch out into multiple pathways from any point
- Explore each branch with detailed steps
- Track probability and status of each branch
- Identify insights and outcomes for each exploration
- Visualize the complete tree of possibilities
- Support for abandoning unproductive branches
- Multi-level branching for complex scenario exploration

## Usage

### Installation

```bash
npm install -g @cognitivegraphai/branching-exploration
```

### Running the Server

```bash
npx @cognitivegraphai/branching-exploration
```

## API

The server provides the following actions:

### `createScenario`

Create a new scenario as the root of a branching exploration.

```json
{
  "action": "createScenario",
  "scenarioData": {
    "scenarioId": "scenario-123",
    "scenarioName": "Product Launch Strategy",
    "scenarioDescription": "Exploring different strategies for launching our new product",
    "initialConditions": "Limited budget, competitive market, 3-month timeline",
    "objectives": [
      "Maximize market penetration",
      "Minimize costs",
      "Build brand awareness"
    ],
    "constraints": [
      "Budget cannot exceed $100,000",
      "Must launch within 3 months",
      "Must comply with industry regulations"
    ]
  }
}
```

### `createBranch`

Create a new branch from a scenario or another branch.

```json
{
  "action": "createBranch",
  "branchData": {
    "branchId": "branch-456",
    "parentScenarioId": "scenario-123",
    "parentBranchId": null,
    "branchName": "Digital Marketing Focus",
    "branchDescription": "Focus primarily on digital marketing channels",
    "branchConditions": "If digital channels show higher ROI than traditional",
    "probability": 0.7,
    "depth": 1,
    "status": "unexplored"
  }
}
```

### `updateBranchStatus`

Update the status of a branch.

```json
{
  "action": "updateBranchStatus",
  "branchId": "branch-456",
  "status": "exploring"
}
```

### `createExploration`

Create an exploration step for a branch.

```json
{
  "action": "createExploration",
  "explorationData": {
    "explorationId": "exploration-789",
    "branchId": "branch-456",
    "explorationStep": 1,
    "totalSteps": 3,
    "description": "Analyze social media marketing effectiveness",
    "outcome": "Social media shows 2.5x ROI compared to other channels",
    "insights": [
      "Instagram performs best for our target demographic",
      "Video content generates 3x engagement of static posts"
    ],
    "nextBranches": ["branch-567", "branch-568"],
    "isTerminal": false
  }
}
```

### `getScenarioDetails`

Get details about a scenario and its branches.

```json
{
  "action": "getScenarioDetails",
  "scenarioId": "scenario-123"
}
```

### `getBranchDetails`

Get details about a branch and its explorations.

```json
{
  "action": "getBranchDetails",
  "branchId": "branch-456"
}
```

### `getExplorationDetails`

Get details about an exploration step.

```json
{
  "action": "getExplorationDetails",
  "explorationId": "exploration-789"
}
```

### `getScenarioTree`

Get the complete tree structure of a scenario.

```json
{
  "action": "getScenarioTree",
  "scenarioId": "scenario-123"
}
```

### `abandonBranch`

Mark a branch as abandoned with a reason.

```json
{
  "action": "abandonBranch",
  "branchId": "branch-456",
  "reason": "Cost exceeds budget constraints"
}
```

## License

MIT