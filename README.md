# Thinking Patterns

This repository is a collection of [MCP](https://modelcontextprotocol.io/) **Thinking Patterns** - specialized tools that enhance AI reasoning capabilities through structured cognitive frameworks.

## Available Patterns

- **[Decomposition](decomposition)** - A powerful tool for breaking down complex problems into manageable components with clear relationships, dependencies, and metrics for evaluating decomposition quality
- **[Sequential Thinking](sequentialthinking)** - Dynamic and reflective problem-solving through thought sequences that can adapt and evolve, supporting revision of previous thoughts and exploration of alternative approaches
- **[Validation Thinking](validationthinking)** - A rigorous validation tool for systematically reviewing, double-checking, and identifying inconsistencies in any content, solution, or reasoning process using multiple validation techniques

## Installation and Usage

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

You can install all thinking patterns at once using npm workspaces:

```bash
git clone https://github.com/cognitivegraphai/thinking-patterns.git
cd thinking-patterns
npm install
```

This will install all dependencies for all thinking patterns in the repository.

If you prefer to install just a specific thinking pattern:

```bash
cd thinking-patterns/sequentialthinking  # or decomposition, or validationthinking
npm install
```

### Running a Thinking Pattern

Each thinking pattern can be run as an MCP server:

```bash
servers: {
    sequentialThinking: {
        command: "node",
        args: ["thinking-patterns/sequentialthinking/dist/index.js"],
    },
    decomposition: {
        command: "node",
        args: ["thinking-patterns/decomposition/dist/index.js"],
    },
    validationthinking: {
        command: "node",
        args: ["thinking-patterns/validationthinking/dist/index.js"],
    },
}
```

### Using with AI Assistants

These thinking patterns are designed to be used with AI assistants that support the Model Context Protocol (MCP). When connected, they provide specialized reasoning capabilities to the AI.

Example of connecting to an AI assistant:

1. Start the MCP server for your chosen thinking pattern
2. Connect your AI assistant to the MCP server
3. The AI can now use the specialized reasoning capabilities provided by the thinking pattern

## Project Structure

The repository is set up as an npm workspace, allowing you to install and manage all thinking patterns from the root directory:

- `package.json` - Root package with workspace configuration
- `tsconfig.json` - Base TypeScript configuration
- `.gitignore` - Specifies files to be ignored by Git
- `/decomposition` - Decomposition thinking pattern module
- `/sequentialthinking` - Sequential thinking pattern module
- `/validationthinking` - Validation thinking pattern module

Each module contains its own package.json, TypeScript code, and configuration.

## Pattern Details

### Decomposition

The Decomposition pattern helps break down complex problems into manageable components. Key features:

- Create and manage problem definitions
- Decompose problems into components with clear relationships
- Track dependencies between components
- Measure complexity and balance of decomposition
- Support for phased decomposition approaches
- Metrics for evaluating decomposition quality

### Sequential Thinking

The Sequential Thinking pattern enables dynamic and reflective problem-solving. Key features:

- Adjust total thoughts up or down as you progress
- Question or revise previous thoughts
- Add more thoughts even after reaching what seemed like the end
- Express uncertainty and explore alternative approaches
- Branch or backtrack in your thinking process
- Generate and verify solution hypotheses

### Validation Thinking

The Validation Thinking pattern provides rigorous validation for any content or reasoning. Key features:

- Multiple validation techniques (cross-referencing, logic testing, etc.)
- Tracks identified issues systematically
- Maintains validation trail for accountability
- Adjustable validation depth
- Confidence assessment for each validation
- Improvement suggestions when issues are found