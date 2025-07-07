#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

// Interface definitions
interface ProblemData {
  problemId: string;
  problemStatement: string;
  complexity: number;
  domain: string;
  constraints: string[];
  createdAt: number;
}

interface ComponentData {
  componentId: string;
  parentProblemId: string;
  name: string;
  description: string;
  dependencies: string[];
  status: "pending" | "in-progress" | "completed";
  complexity: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
}

interface DecompositionPhase {
  phaseId: string;
  phaseName: string;
  description: string;
  startedAt: number;
  completedAt?: number;
  metrics: DecompositionMetrics;
}

interface DecompositionMetrics {
  componentCount: number;
  averageComplexity: number;
  maxDepth: number;
  dependencyCount: number;
  balanceScore: number;
}

interface DecompositionState {
  problems: Record<string, ProblemData>;
  components: Record<string, ComponentData>;
  decompositionPhases: DecompositionPhase[];
  currentPhaseIndex: number;
}

class DecompositionServer {
  private state: DecompositionState;
  private disableLogging: boolean;

  constructor() {
    this.state = this.initializeState();
    this.disableLogging = (process.env.DISABLE_DECOMPOSITION_LOGGING || "").toLowerCase() === "true";
  }

  private initializeState(): DecompositionState {
    return {
      problems: {},
      components: {},
      decompositionPhases: [],
      currentPhaseIndex: -1
    };
  }

  private validateProblemData(input: unknown): ProblemData {
    const data = input as Record<string, unknown>;
    
    if (!data.problemStatement || typeof data.problemStatement !== 'string') {
      throw new Error('Invalid problemStatement: must be a string');
    }
    
    if (!data.problemId || typeof data.problemId !== 'string') {
      throw new Error('Invalid problemId: must be a string');
    }
    
    if (data.complexity !== undefined && (typeof data.complexity !== 'number' || data.complexity < 1 || data.complexity > 10)) {
      throw new Error('Invalid complexity: must be a number between 1 and 10');
    }
    
    if (data.domain !== undefined && typeof data.domain !== 'string') {
      throw new Error('Invalid domain: must be a string');
    }
    
    if (data.constraints !== undefined && (!Array.isArray(data.constraints) || !data.constraints.every(c => typeof c === 'string'))) {
      throw new Error('Invalid constraints: must be an array of strings');
    }
    
    return {
      problemStatement: data.problemStatement as string,
      problemId: data.problemId as string,
      complexity: (data.complexity as number) || 5,
      domain: (data.domain as string) || '',
      constraints: (data.constraints as string[]) || [],
      createdAt: Date.now()
    };
  }

  private validateComponentData(input: unknown): ComponentData {
    const data = input as Record<string, unknown>;
    
    if (!data.componentId || typeof data.componentId !== 'string') {
      throw new Error('Invalid componentId: must be a string');
    }
    
    if (!data.parentProblemId || typeof data.parentProblemId !== 'string') {
      throw new Error('Invalid parentProblemId: must be a string');
    }
    
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Invalid name: must be a string');
    }
    
    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Invalid description: must be a string');
    }
    
    if (data.dependencies !== undefined && (!Array.isArray(data.dependencies) || !data.dependencies.every(d => typeof d === 'string'))) {
      throw new Error('Invalid dependencies: must be an array of strings');
    }
    
    if (data.status !== undefined && !['pending', 'in-progress', 'completed'].includes(data.status as string)) {
      throw new Error('Invalid status: must be one of "pending", "in-progress", "completed"');
    }
    
    if (data.complexity !== undefined && (typeof data.complexity !== 'number' || data.complexity < 1 || data.complexity > 10)) {
      throw new Error('Invalid complexity: must be a number between 1 and 10');
    }
    
    const now = Date.now();
    
    return {
      componentId: data.componentId as string,
      parentProblemId: data.parentProblemId as string,
      name: data.name as string,
      description: data.description as string,
      dependencies: (data.dependencies as string[]) || [],
      status: (data.status as "pending" | "in-progress" | "completed") || "pending",
      complexity: (data.complexity as number) || 5,
      createdAt: now,
      updatedAt: now,
      metadata: (data.metadata as Record<string, any>) || {}
    };
  }

  private validatePhaseData(input: unknown): Partial<DecompositionPhase> {
    const data = input as Record<string, unknown>;
    
    if (!data.phaseId || typeof data.phaseId !== 'string') {
      throw new Error('Invalid phaseId: must be a string');
    }
    
    if (!data.phaseName || typeof data.phaseName !== 'string') {
      throw new Error('Invalid phaseName: must be a string');
    }
    
    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Invalid description: must be a string');
    }
    
    return {
      phaseId: data.phaseId as string,
      phaseName: data.phaseName as string,
      description: data.description as string,
      startedAt: Date.now()
    };
  }

  private buildDependencyGraph(components: ComponentData[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    components.forEach(component => {
      graph.set(component.componentId, component.dependencies);
    });
    
    return graph;
  }

  private calculateMaxDepth(graph: Map<string, string[]>): number {
    const visited = new Set<string>();
    const depths = new Map<string, number>();
    
    const dfs = (nodeId: string): number => {
      if (depths.has(nodeId)) {
        return depths.get(nodeId)!;
      }
      
      if (visited.has(nodeId)) {
        // Cycle detected, return 0 for this path
        return 0;
      }
      
      visited.add(nodeId);
      
      const dependencies = graph.get(nodeId) || [];
      if (dependencies.length === 0) {
        depths.set(nodeId, 1);
        return 1;
      }
      
      const maxChildDepth = Math.max(
        ...dependencies.map(depId => dfs(depId))
      );
      
      const depth = 1 + maxChildDepth;
      depths.set(nodeId, depth);
      
      visited.delete(nodeId);
      
      return depth;
    };
    
    let maxDepth = 0;
    for (const nodeId of graph.keys()) {
      maxDepth = Math.max(maxDepth, dfs(nodeId));
    }
    
    return maxDepth;
  }

  private calculateBalanceScore(components: ComponentData[], graph: Map<string, string[]>): number {
    if (components.length <= 1) {
      return 10; // Perfect balance for a single component
    }
    
    // Calculate in-degree (number of components that depend on this one)
    const inDegree = new Map<string, number>();
    components.forEach(component => {
      inDegree.set(component.componentId, 0);
    });
    
    for (const deps of graph.values()) {
      for (const dep of deps) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }
    
    // Calculate standard deviation of in-degrees
    const inDegrees = Array.from(inDegree.values());
    const mean = inDegrees.reduce((sum, val) => sum + val, 0) / inDegrees.length;
    const variance = inDegrees.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / inDegrees.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate balance score (10 is perfect balance, 1 is poor balance)
    // Lower standard deviation means better balance
    const maxPossibleStdDev = components.length - 1; // Worst case: one component depends on all others
    const normalizedStdDev = stdDev / maxPossibleStdDev;
    const balanceScore = 10 * (1 - normalizedStdDev);
    
    // Ensure score is between 1 and 10
    return Math.max(1, Math.min(10, balanceScore));
  }

  public calculateMetrics(problemId: string): DecompositionMetrics {
    const components = Object.values(this.state.components)
      .filter(component => component.parentProblemId === problemId);
    
    if (components.length === 0) {
      return {
        componentCount: 0,
        averageComplexity: 0,
        maxDepth: 0,
        dependencyCount: 0,
        balanceScore: 10
      };
    }
    
    // Calculate component count
    const componentCount = components.length;
    
    // Calculate average complexity
    const totalComplexity = components.reduce((sum, component) => sum + component.complexity, 0);
    const averageComplexity = totalComplexity / componentCount;
    
    // Calculate dependency graph and max depth
    const dependencyGraph = this.buildDependencyGraph(components);
    const maxDepth = this.calculateMaxDepth(dependencyGraph);
    
    // Calculate total dependency count
    const dependencyCount = components.reduce((sum, component) => 
      sum + component.dependencies.length, 0);
    
    // Calculate balance score (how evenly distributed the components are)
    const balanceScore = this.calculateBalanceScore(components, dependencyGraph);
    
    return {
      componentCount,
      averageComplexity,
      maxDepth,
      dependencyCount,
      balanceScore
    };
  }

  private formatComponent(component: ComponentData): string {
    const { name, description, status, complexity, dependencies } = component;
    
    let statusColor;
    switch (status) {
      case 'pending':
        statusColor = chalk.yellow;
        break;
      case 'in-progress':
        statusColor = chalk.blue;
        break;
      case 'completed':
        statusColor = chalk.green;
        break;
      default:
        statusColor = chalk.white;
    }
    
    const header = `${chalk.cyan('🧩 Component:')} ${name} (${statusColor(status)}, complexity: ${complexity})`;
    const dependenciesText = dependencies.length > 0 
      ? `${chalk.magenta('Dependencies:')} ${dependencies.join(', ')}` 
      : `${chalk.magenta('Dependencies:')} None`;
    
    const border = '─'.repeat(Math.max(header.length, description.length, dependenciesText.length) + 4);
    
    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${description.padEnd(border.length - 2)} │
│ ${dependenciesText.padEnd(border.length - 2)} │
└${border}┘`;
  }

  public processRequest(action: string, args: Record<string, unknown>): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      switch (action) {
        case 'createProblem': {
          const problemData = this.validateProblemData(args.problemData);
          
          if (this.state.problems[problemData.problemId]) {
            throw new Error(`Problem with ID ${problemData.problemId} already exists`);
          }
          
          this.state.problems[problemData.problemId] = problemData;
          
          if (!this.disableLogging) {
            console.error(chalk.green(`Created problem: ${problemData.problemId}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Problem ${problemData.problemId} created successfully`,
                problem: problemData
              }, null, 2)
            }]
          };
        }
        
        case 'updateProblem': {
          const problemData = this.validateProblemData(args.problemData);
          
          if (!this.state.problems[problemData.problemId]) {
            throw new Error(`Problem with ID ${problemData.problemId} does not exist`);
          }
          
          // Preserve creation timestamp
          const createdAt = this.state.problems[problemData.problemId].createdAt;
          this.state.problems[problemData.problemId] = {
            ...problemData,
            createdAt
          };
          
          if (!this.disableLogging) {
            console.error(chalk.blue(`Updated problem: ${problemData.problemId}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Problem ${problemData.problemId} updated successfully`,
                problem: this.state.problems[problemData.problemId]
              }, null, 2)
            }]
          };
        }
        
        case 'createComponent': {
          const componentData = this.validateComponentData(args.componentData);
          
          if (this.state.components[componentData.componentId]) {
            throw new Error(`Component with ID ${componentData.componentId} already exists`);
          }
          
          if (!this.state.problems[componentData.parentProblemId]) {
            throw new Error(`Parent problem with ID ${componentData.parentProblemId} does not exist`);
          }
          
          // Validate dependencies
          for (const depId of componentData.dependencies) {
            if (!this.state.components[depId]) {
              throw new Error(`Dependency component with ID ${depId} does not exist`);
            }
          }
          
          this.state.components[componentData.componentId] = componentData;
          
          if (!this.disableLogging) {
            console.error(this.formatComponent(componentData));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Component ${componentData.componentId} created successfully`,
                component: componentData
              }, null, 2)
            }]
          };
        }
        
        case 'updateComponent': {
          const componentData = this.validateComponentData(args.componentData);
          
          if (!this.state.components[componentData.componentId]) {
            throw new Error(`Component with ID ${componentData.componentId} does not exist`);
          }
          
          // Preserve creation timestamp
          const createdAt = this.state.components[componentData.componentId].createdAt;
          this.state.components[componentData.componentId] = {
            ...componentData,
            createdAt,
            updatedAt: Date.now()
          };
          
          if (!this.disableLogging) {
            console.error(chalk.blue(`Updated component: ${componentData.componentId}`));
            console.error(this.formatComponent(this.state.components[componentData.componentId]));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Component ${componentData.componentId} updated successfully`,
                component: this.state.components[componentData.componentId]
              }, null, 2)
            }]
          };
        }
        
        case 'linkComponents': {
          const { sourceId, targetId } = args as { sourceId: string, targetId: string };
          
          if (!sourceId || typeof sourceId !== 'string') {
            throw new Error('Invalid sourceId: must be a string');
          }
          
          if (!targetId || typeof targetId !== 'string') {
            throw new Error('Invalid targetId: must be a string');
          }
          
          if (!this.state.components[sourceId]) {
            throw new Error(`Source component with ID ${sourceId} does not exist`);
          }
          
          if (!this.state.components[targetId]) {
            throw new Error(`Target component with ID ${targetId} does not exist`);
          }
          
          // Check for circular dependencies
          const visited = new Set<string>();
          const checkCircular = (currentId: string, targetId: string): boolean => {
            if (currentId === targetId) return true;
            if (visited.has(currentId)) return false;
            
            visited.add(currentId);
            
            const dependencies = this.state.components[currentId].dependencies;
            for (const depId of dependencies) {
              if (checkCircular(depId, targetId)) return true;
            }
            
            return false;
          };
          
          if (checkCircular(targetId, sourceId)) {
            throw new Error('Cannot create circular dependency');
          }
          
          // Add dependency if it doesn't already exist
          if (!this.state.components[sourceId].dependencies.includes(targetId)) {
            this.state.components[sourceId].dependencies.push(targetId);
            this.state.components[sourceId].updatedAt = Date.now();
            
            if (!this.disableLogging) {
              console.error(chalk.blue(`Linked component ${sourceId} to depend on ${targetId}`));
            }
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Component ${sourceId} now depends on ${targetId}`,
                component: this.state.components[sourceId]
              }, null, 2)
            }]
          };
        }
        
        case 'startPhase': {
          const phaseData = this.validatePhaseData(args.phaseData);
          
          const newPhase: DecompositionPhase = {
            phaseId: phaseData.phaseId!,
            phaseName: phaseData.phaseName!,
            description: phaseData.description!,
            startedAt: phaseData.startedAt!,
            metrics: {
              componentCount: 0,
              averageComplexity: 0,
              maxDepth: 0,
              dependencyCount: 0,
              balanceScore: 10
            }
          };
          
          this.state.decompositionPhases.push(newPhase);
          this.state.currentPhaseIndex = this.state.decompositionPhases.length - 1;
          
          if (!this.disableLogging) {
            console.error(chalk.green(`Started phase: ${newPhase.phaseName}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Phase ${newPhase.phaseName} started successfully`,
                phase: newPhase
              }, null, 2)
            }]
          };
        }
        
        case 'completePhase': {
          const { phaseId, problemId } = args as { phaseId: string, problemId: string };
          
          if (!phaseId || typeof phaseId !== 'string') {
            throw new Error('Invalid phaseId: must be a string');
          }
          
          if (!problemId || typeof problemId !== 'string') {
            throw new Error('Invalid problemId: must be a string');
          }
          
          const phaseIndex = this.state.decompositionPhases.findIndex(p => p.phaseId === phaseId);
          if (phaseIndex === -1) {
            throw new Error(`Phase with ID ${phaseId} does not exist`);
          }
          
          if (!this.state.problems[problemId]) {
            throw new Error(`Problem with ID ${problemId} does not exist`);
          }
          
          // Calculate metrics for the problem
          const metrics = this.calculateMetrics(problemId);
          
          // Update phase with completion time and metrics
          this.state.decompositionPhases[phaseIndex].completedAt = Date.now();
          this.state.decompositionPhases[phaseIndex].metrics = metrics;
          
          if (!this.disableLogging) {
            console.error(chalk.green(`Completed phase: ${this.state.decompositionPhases[phaseIndex].phaseName}`));
            console.error(chalk.cyan(`Metrics: ${JSON.stringify(metrics, null, 2)}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Phase ${this.state.decompositionPhases[phaseIndex].phaseName} completed successfully`,
                phase: this.state.decompositionPhases[phaseIndex]
              }, null, 2)
            }]
          };
        }
        
        case 'calculateMetrics': {
          const { problemId } = args as { problemId: string };
          
          if (!problemId || typeof problemId !== 'string') {
            throw new Error('Invalid problemId: must be a string');
          }
          
          if (!this.state.problems[problemId]) {
            throw new Error(`Problem with ID ${problemId} does not exist`);
          }
          
          const metrics = this.calculateMetrics(problemId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                metrics
              }, null, 2)
            }]
          };
        }
        
        case 'getDecomposition': {
          const { problemId } = args as { problemId: string };
          
          if (!problemId || typeof problemId !== 'string') {
            throw new Error('Invalid problemId: must be a string');
          }
          
          if (!this.state.problems[problemId]) {
            throw new Error(`Problem with ID ${problemId} does not exist`);
          }
          
          const problem = this.state.problems[problemId];
          const components = Object.values(this.state.components)
            .filter(component => component.parentProblemId === problemId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                problem,
                components,
                metrics: this.calculateMetrics(problemId)
              }, null, 2)
            }]
          };
        }
        
        case 'getComponentDetails': {
          const { componentId } = args as { componentId: string };
          
          if (!componentId || typeof componentId !== 'string') {
            throw new Error('Invalid componentId: must be a string');
          }
          
          if (!this.state.components[componentId]) {
            throw new Error(`Component with ID ${componentId} does not exist`);
          }
          
          const component = this.state.components[componentId];
          
          // Get dependencies and dependents
          const dependencies = component.dependencies.map(depId => this.state.components[depId]);
          const dependents = Object.values(this.state.components)
            .filter(comp => comp.dependencies.includes(componentId));
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                component,
                dependencies,
                dependents
              }, null, 2)
            }]
          };
        }
        
        case 'getProblemDetails': {
          const { problemId } = args as { problemId: string };
          
          if (!problemId || typeof problemId !== 'string') {
            throw new Error('Invalid problemId: must be a string');
          }
          
          if (!this.state.problems[problemId]) {
            throw new Error(`Problem with ID ${problemId} does not exist`);
          }
          
          const problem = this.state.problems[problemId];
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                problem
              }, null, 2)
            }]
          };
        }
        
        case 'getPhaseHistory': {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                phases: this.state.decompositionPhases,
                currentPhaseIndex: this.state.currentPhaseIndex
              }, null, 2)
            }]
          };
        }
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
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

// Tool schema definition
const DECOMPOSITION_TOOL: Tool = {
  name: "decomposition",
  description: `A powerful tool for breaking down complex problems into manageable components.
This tool helps analyze problems through a structured decomposition process that identifies components, dependencies, and relationships.

When to use this tool:
- Breaking down complex systems or problems into smaller, manageable parts
- Identifying dependencies between components
- Planning implementation strategies for complex tasks
- Creating hierarchical structures for problem-solving
- Analyzing the complexity and scope of different problem components

Key features:
- Create and manage problem definitions
- Decompose problems into components with clear relationships
- Track dependencies between components
- Measure complexity and balance of decomposition
- Support for phased decomposition approaches
- Metrics for evaluating decomposition quality`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "createProblem",
          "updateProblem",
          "createComponent",
          "updateComponent",
          "linkComponents",
          "startPhase",
          "completePhase",
          "calculateMetrics",
          "getDecomposition",
          "getComponentDetails",
          "getProblemDetails",
          "getPhaseHistory"
        ],
        description: "The decomposition action to perform"
      },
      problemData: {
        type: "object",
        properties: {
          problemId: { type: "string", description: "Unique identifier for the problem" },
          problemStatement: { type: "string", description: "Clear statement of the problem" },
          complexity: { type: "number", description: "Estimated complexity on a scale of 1-10" },
          domain: { type: "string", description: "Domain or field the problem belongs to" },
          constraints: { 
            type: "array", 
            items: { type: "string" },
            description: "List of constraints or requirements"
          }
        },
        required: ["problemId", "problemStatement"]
      },
      componentData: {
        type: "object",
        properties: {
          componentId: { type: "string", description: "Unique identifier for the component" },
          parentProblemId: { type: "string", description: "ID of the problem this component belongs to" },
          name: { type: "string", description: "Name of the component" },
          description: { type: "string", description: "Detailed description of the component" },
          dependencies: { 
            type: "array", 
            items: { type: "string" },
            description: "IDs of components this component depends on"
          },
          status: { 
            type: "string", 
            enum: ["pending", "in-progress", "completed"],
            description: "Current status of the component"
          },
          complexity: { 
            type: "number", 
            description: "Estimated complexity on a scale of 1-10"
          },
          metadata: {
            type: "object",
            description: "Additional metadata for the component"
          }
        },
        required: ["componentId", "parentProblemId", "name", "description"]
      },
      phaseData: {
        type: "object",
        properties: {
          phaseId: { type: "string", description: "Unique identifier for the phase" },
          phaseName: { type: "string", description: "Name of the decomposition phase" },
          description: { type: "string", description: "Description of the phase's purpose" }
        },
        required: ["phaseId", "phaseName", "description"]
      },
      sourceId: { type: "string", description: "ID of the source component in a linkage" },
      targetId: { type: "string", description: "ID of the target component in a linkage" },
      problemId: { type: "string", description: "ID of the problem to operate on" },
      componentId: { type: "string", description: "ID of the component to operate on" },
      phaseId: { type: "string", description: "ID of the phase to operate on" }
    },
    required: ["action"]
  }
};

// Server setup
const server = new Server(
  {
    name: "decomposition-server",
    version: "0.7.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const decompositionServer = new DecompositionServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [DECOMPOSITION_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "decomposition" && request.params.arguments) {
    return decompositionServer.processRequest(
      request.params.arguments.action as string,
      request.params.arguments as Record<string, unknown>
    );
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Decomposition MCP Server running on stdio (simplified in-memory state)");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});