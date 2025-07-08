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
interface ScenarioData {
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;
  initialConditions: string;
  objectives: string[];
  constraints: string[];
  createdAt: number;
}

interface BranchData {
  branchId: string;
  parentScenarioId: string;
  parentBranchId?: string;
  branchName: string;
  branchDescription: string;
  branchConditions: string;
  probability: number;
  depth: number;
  status: "unexplored" | "exploring" | "completed" | "abandoned";
  createdAt: number;
  updatedAt: number;
}

interface ExplorationData {
  explorationId: string;
  branchId: string;
  explorationStep: number;
  totalSteps: number;
  description: string;
  outcome: string;
  insights: string[];
  nextBranches: string[];
  isTerminal: boolean;
  createdAt: number;
}

interface BranchingExplorationState {
  scenarios: Record<string, ScenarioData>;
  branches: Record<string, BranchData>;
  explorations: Record<string, ExplorationData>;
  currentScenarioId: string | null;
  currentBranchId: string | null;
}

class BranchingExplorationServer {
  private state: BranchingExplorationState;
  private disableLogging: boolean;

  constructor() {
    this.state = this.initializeState();
    this.disableLogging = (process.env.DISABLE_BRANCHING_EXPLORATION_LOGGING || "").toLowerCase() === "true";
  }

  private initializeState(): BranchingExplorationState {
    return {
      scenarios: {},
      branches: {},
      explorations: {},
      currentScenarioId: null,
      currentBranchId: null
    };
  }

  private validateScenarioData(input: unknown): ScenarioData {
    const data = input as Record<string, unknown>;
    
    if (!data.scenarioId || typeof data.scenarioId !== 'string') {
      throw new Error('Invalid scenarioId: must be a string');
    }
    
    if (!data.scenarioName || typeof data.scenarioName !== 'string') {
      throw new Error('Invalid scenarioName: must be a string');
    }
    
    if (!data.scenarioDescription || typeof data.scenarioDescription !== 'string') {
      throw new Error('Invalid scenarioDescription: must be a string');
    }
    
    if (!data.initialConditions || typeof data.initialConditions !== 'string') {
      throw new Error('Invalid initialConditions: must be a string');
    }
    
    if (!data.objectives || !Array.isArray(data.objectives) || 
        !data.objectives.every(obj => typeof obj === 'string')) {
      throw new Error('Invalid objectives: must be an array of strings');
    }
    
    if (!data.constraints || !Array.isArray(data.constraints) || 
        !data.constraints.every(constraint => typeof constraint === 'string')) {
      throw new Error('Invalid constraints: must be an array of strings');
    }
    
    return {
      scenarioId: data.scenarioId as string,
      scenarioName: data.scenarioName as string,
      scenarioDescription: data.scenarioDescription as string,
      initialConditions: data.initialConditions as string,
      objectives: data.objectives as string[],
      constraints: data.constraints as string[],
      createdAt: Date.now()
    };
  }

  private validateBranchData(input: unknown): BranchData {
    const data = input as Record<string, unknown>;
    
    if (!data.branchId || typeof data.branchId !== 'string') {
      throw new Error('Invalid branchId: must be a string');
    }
    
    if (!data.parentScenarioId || typeof data.parentScenarioId !== 'string') {
      throw new Error('Invalid parentScenarioId: must be a string');
    }
    
    if (data.parentBranchId !== undefined && typeof data.parentBranchId !== 'string') {
      throw new Error('Invalid parentBranchId: must be a string');
    }
    
    if (!data.branchName || typeof data.branchName !== 'string') {
      throw new Error('Invalid branchName: must be a string');
    }
    
    if (!data.branchDescription || typeof data.branchDescription !== 'string') {
      throw new Error('Invalid branchDescription: must be a string');
    }
    
    if (!data.branchConditions || typeof data.branchConditions !== 'string') {
      throw new Error('Invalid branchConditions: must be a string');
    }
    
    if (data.probability === undefined || typeof data.probability !== 'number' || 
        data.probability < 0 || data.probability > 1) {
      throw new Error('Invalid probability: must be a number between 0 and 1');
    }
    
    if (data.depth === undefined || typeof data.depth !== 'number' || data.depth < 0) {
      throw new Error('Invalid depth: must be a non-negative number');
    }
    
    if (!data.status || typeof data.status !== 'string' || 
        !['unexplored', 'exploring', 'completed', 'abandoned'].includes(data.status as string)) {
      throw new Error('Invalid status: must be one of "unexplored", "exploring", "completed", "abandoned"');
    }
    
    const now = Date.now();
    
    return {
      branchId: data.branchId as string,
      parentScenarioId: data.parentScenarioId as string,
      parentBranchId: data.parentBranchId as string | undefined,
      branchName: data.branchName as string,
      branchDescription: data.branchDescription as string,
      branchConditions: data.branchConditions as string,
      probability: data.probability as number,
      depth: data.depth as number,
      status: data.status as "unexplored" | "exploring" | "completed" | "abandoned",
      createdAt: now,
      updatedAt: now
    };
  }

  private validateExplorationData(input: unknown): ExplorationData {
    const data = input as Record<string, unknown>;
    
    if (!data.explorationId || typeof data.explorationId !== 'string') {
      throw new Error('Invalid explorationId: must be a string');
    }
    
    if (!data.branchId || typeof data.branchId !== 'string') {
      throw new Error('Invalid branchId: must be a string');
    }
    
    if (data.explorationStep === undefined || typeof data.explorationStep !== 'number' || 
        data.explorationStep < 1) {
      throw new Error('Invalid explorationStep: must be a positive number');
    }
    
    if (data.totalSteps === undefined || typeof data.totalSteps !== 'number' || 
        data.totalSteps < 1) {
      throw new Error('Invalid totalSteps: must be a positive number');
    }
    
    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Invalid description: must be a string');
    }
    
    if (!data.outcome || typeof data.outcome !== 'string') {
      throw new Error('Invalid outcome: must be a string');
    }
    
    if (!data.insights || !Array.isArray(data.insights) || 
        !data.insights.every(insight => typeof insight === 'string')) {
      throw new Error('Invalid insights: must be an array of strings');
    }
    
    if (!data.nextBranches || !Array.isArray(data.nextBranches) || 
        !data.nextBranches.every(branch => typeof branch === 'string')) {
      throw new Error('Invalid nextBranches: must be an array of strings');
    }
    
    if (typeof data.isTerminal !== 'boolean') {
      throw new Error('Invalid isTerminal: must be a boolean');
    }
    
    return {
      explorationId: data.explorationId as string,
      branchId: data.branchId as string,
      explorationStep: data.explorationStep as number,
      totalSteps: data.totalSteps as number,
      description: data.description as string,
      outcome: data.outcome as string,
      insights: data.insights as string[],
      nextBranches: data.nextBranches as string[],
      isTerminal: data.isTerminal as boolean,
      createdAt: Date.now()
    };
  }

  private formatScenario(scenarioData: ScenarioData): string {
    const { 
      scenarioName, 
      scenarioDescription, 
      initialConditions, 
      objectives, 
      constraints 
    } = scenarioData;
    
    const header = `${chalk.blue('🌳 Scenario:')} ${scenarioName}`;
    const description = `${chalk.cyan('Description:')} ${scenarioDescription}`;
    const conditions = `${chalk.cyan('Initial Conditions:')} ${initialConditions}`;
    
    let objectivesList = '';
    if (objectives.length > 0) {
      objectivesList = `${chalk.cyan('Objectives:')}\n`;
      objectives.forEach((objective, index) => {
        objectivesList += `  ${index + 1}. ${objective}\n`;
      });
    } else {
      objectivesList = `${chalk.cyan('Objectives:')} None`;
    }
    
    let constraintsList = '';
    if (constraints.length > 0) {
      constraintsList = `${chalk.cyan('Constraints:')}\n`;
      constraints.forEach((constraint, index) => {
        constraintsList += `  ${index + 1}. ${constraint}\n`;
      });
    } else {
      constraintsList = `${chalk.cyan('Constraints:')} None`;
    }
    
    const content = [header, description, conditions, objectivesList, constraintsList];
    const maxLength = Math.max(...content.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);
    
    let output = `\n┌${border}┐\n`;
    content.forEach(line => {
      if ((line === objectivesList && objectives.length > 0) || 
          (line === constraintsList && constraints.length > 0)) {
        output += `│ ${line.split('\n')[0].padEnd(maxLength)} │\n`;
        const items = line === objectivesList ? objectives : constraints;
        items.forEach((item, index) => {
          output += `│   ${index + 1}. ${item.padEnd(maxLength - 5)} │\n`;
        });
      } else {
        output += `│ ${line.padEnd(maxLength)} │\n`;
      }
    });
    output += `└${border}┘`;
    
    return output;
  }

  private formatBranch(branchData: BranchData): string {
    const { 
      branchName, 
      branchDescription, 
      branchConditions, 
      probability, 
      depth, 
      status 
    } = branchData;
    
    let statusColor;
    switch (status) {
      case 'unexplored':
        statusColor = chalk.gray;
        break;
      case 'exploring':
        statusColor = chalk.blue;
        break;
      case 'completed':
        statusColor = chalk.green;
        break;
      case 'abandoned':
        statusColor = chalk.red;
        break;
      default:
        statusColor = chalk.white;
    }
    
    const probabilityPercentage = Math.round(probability * 100);
    const probabilityColor = probabilityPercentage > 70 ? chalk.green : 
                            probabilityPercentage > 30 ? chalk.yellow : 
                            chalk.red;
    
    const header = `${chalk.magenta('🌿 Branch:')} ${branchName} (Depth: ${depth})`;
    const description = `${chalk.cyan('Description:')} ${branchDescription}`;
    const conditions = `${chalk.cyan('Conditions:')} ${branchConditions}`;
    const probabilityText = `${chalk.cyan('Probability:')} ${probabilityColor(probabilityPercentage + '%')}`;
    const statusText = `${chalk.cyan('Status:')} ${statusColor(status)}`;
    
    const content = [header, description, conditions, probabilityText, statusText];
    const maxLength = Math.max(...content.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);
    
    let output = `\n┌${border}┐\n`;
    content.forEach(line => {
      output += `│ ${line.padEnd(maxLength)} │\n`;
    });
    output += `└${border}┘`;
    
    return output;
  }

  private formatExploration(explorationData: ExplorationData): string {
    const { 
      explorationStep, 
      totalSteps, 
      description, 
      outcome, 
      insights, 
      nextBranches, 
      isTerminal 
    } = explorationData;
    
    const header = `${chalk.yellow('🔍 Exploration')} ${explorationStep}/${totalSteps}`;
    const descriptionText = `${chalk.cyan('Description:')} ${description}`;
    const outcomeText = `${chalk.cyan('Outcome:')} ${outcome}`;
    const terminalText = `${chalk.cyan('Terminal:')} ${isTerminal ? chalk.red('Yes') : chalk.green('No')}`;
    
    let insightsList = '';
    if (insights.length > 0) {
      insightsList = `${chalk.cyan('Insights:')}\n`;
      insights.forEach((insight, index) => {
        insightsList += `  ${index + 1}. ${insight}\n`;
      });
    } else {
      insightsList = `${chalk.cyan('Insights:')} None`;
    }
    
    let nextBranchesList = '';
    if (nextBranches.length > 0) {
      nextBranchesList = `${chalk.cyan('Next Branches:')}\n`;
      nextBranches.forEach((branch, index) => {
        nextBranchesList += `  ${index + 1}. ${branch}\n`;
      });
    } else {
      nextBranchesList = `${chalk.cyan('Next Branches:')} None`;
    }
    
    const content = [header, descriptionText, outcomeText, terminalText, insightsList, nextBranchesList];
    const maxLength = Math.max(...content.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);
    
    let output = `\n┌${border}┐\n`;
    content.forEach(line => {
      if ((line === insightsList && insights.length > 0) || 
          (line === nextBranchesList && nextBranches.length > 0)) {
        output += `│ ${line.split('\n')[0].padEnd(maxLength)} │\n`;
        const items = line === insightsList ? insights : nextBranches;
        items.forEach((item, index) => {
          output += `│   ${index + 1}. ${item.padEnd(maxLength - 5)} │\n`;
        });
      } else {
        output += `│ ${line.padEnd(maxLength)} │\n`;
      }
    });
    output += `└${border}┘`;
    
    return output;
  }

  public processRequest(action: string, args: Record<string, unknown>): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      switch (action) {
        case 'createScenario': {
          const scenarioData = this.validateScenarioData(args.scenarioData);
          
          if (this.state.scenarios[scenarioData.scenarioId]) {
            throw new Error(`Scenario with ID ${scenarioData.scenarioId} already exists`);
          }
          
          this.state.scenarios[scenarioData.scenarioId] = scenarioData;
          this.state.currentScenarioId = scenarioData.scenarioId;
          
          if (!this.disableLogging) {
            console.error(this.formatScenario(scenarioData));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Scenario ${scenarioData.scenarioId} created successfully`,
                scenario: scenarioData
              }, null, 2)
            }]
          };
        }
        
        case 'createBranch': {
          const branchData = this.validateBranchData(args.branchData);
          
          if (this.state.branches[branchData.branchId]) {
            throw new Error(`Branch with ID ${branchData.branchId} already exists`);
          }
          
          if (!this.state.scenarios[branchData.parentScenarioId]) {
            throw new Error(`Parent scenario with ID ${branchData.parentScenarioId} does not exist`);
          }
          
          if (branchData.parentBranchId && !this.state.branches[branchData.parentBranchId]) {
            throw new Error(`Parent branch with ID ${branchData.parentBranchId} does not exist`);
          }
          
          this.state.branches[branchData.branchId] = branchData;
          this.state.currentBranchId = branchData.branchId;
          
          if (!this.disableLogging) {
            console.error(this.formatBranch(branchData));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Branch ${branchData.branchId} created successfully`,
                branch: branchData
              }, null, 2)
            }]
          };
        }
        
        case 'updateBranchStatus': {
          const { branchId, status } = args as { branchId: string, status: string };
          
          if (!branchId || typeof branchId !== 'string') {
            throw new Error('Invalid branchId: must be a string');
          }
          
          if (!status || typeof status !== 'string' || 
              !['unexplored', 'exploring', 'completed', 'abandoned'].includes(status)) {
            throw new Error('Invalid status: must be one of "unexplored", "exploring", "completed", "abandoned"');
          }
          
          if (!this.state.branches[branchId]) {
            throw new Error(`Branch with ID ${branchId} does not exist`);
          }
          
          this.state.branches[branchId].status = status as "unexplored" | "exploring" | "completed" | "abandoned";
          this.state.branches[branchId].updatedAt = Date.now();
          
          if (!this.disableLogging) {
            console.error(chalk.blue(`Updated branch ${branchId} status to ${status}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Branch ${branchId} status updated to ${status}`,
                branch: this.state.branches[branchId]
              }, null, 2)
            }]
          };
        }
        
        case 'createExploration': {
          const explorationData = this.validateExplorationData(args.explorationData);
          
          if (this.state.explorations[explorationData.explorationId]) {
            throw new Error(`Exploration with ID ${explorationData.explorationId} already exists`);
          }
          
          if (!this.state.branches[explorationData.branchId]) {
            throw new Error(`Branch with ID ${explorationData.branchId} does not exist`);
          }
          
          // Update branch status to exploring if it's unexplored
          if (this.state.branches[explorationData.branchId].status === 'unexplored') {
            this.state.branches[explorationData.branchId].status = 'exploring';
            this.state.branches[explorationData.branchId].updatedAt = Date.now();
          }
          
          this.state.explorations[explorationData.explorationId] = explorationData;
          
          // If this is a terminal exploration, update branch status to completed
          if (explorationData.isTerminal) {
            this.state.branches[explorationData.branchId].status = 'completed';
            this.state.branches[explorationData.branchId].updatedAt = Date.now();
          }
          
          if (!this.disableLogging) {
            console.error(this.formatExploration(explorationData));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Exploration ${explorationData.explorationId} created successfully`,
                exploration: explorationData
              }, null, 2)
            }]
          };
        }
        
        case 'getScenarioDetails': {
          const { scenarioId } = args as { scenarioId: string };
          
          if (!scenarioId || typeof scenarioId !== 'string') {
            throw new Error('Invalid scenarioId: must be a string');
          }
          
          if (!this.state.scenarios[scenarioId]) {
            throw new Error(`Scenario with ID ${scenarioId} does not exist`);
          }
          
          const scenario = this.state.scenarios[scenarioId];
          const branches = Object.values(this.state.branches)
            .filter(branch => branch.parentScenarioId === scenarioId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                scenario,
                branches
              }, null, 2)
            }]
          };
        }
        
        case 'getBranchDetails': {
          const { branchId } = args as { branchId: string };
          
          if (!branchId || typeof branchId !== 'string') {
            throw new Error('Invalid branchId: must be a string');
          }
          
          if (!this.state.branches[branchId]) {
            throw new Error(`Branch with ID ${branchId} does not exist`);
          }
          
          const branch = this.state.branches[branchId];
          const explorations = Object.values(this.state.explorations)
            .filter(exploration => exploration.branchId === branchId)
            .sort((a, b) => a.explorationStep - b.explorationStep);
          
          const childBranches = Object.values(this.state.branches)
            .filter(b => b.parentBranchId === branchId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                branch,
                explorations,
                childBranches
              }, null, 2)
            }]
          };
        }
        
        case 'getExplorationDetails': {
          const { explorationId } = args as { explorationId: string };
          
          if (!explorationId || typeof explorationId !== 'string') {
            throw new Error('Invalid explorationId: must be a string');
          }
          
          if (!this.state.explorations[explorationId]) {
            throw new Error(`Exploration with ID ${explorationId} does not exist`);
          }
          
          const exploration = this.state.explorations[explorationId];
          const branch = this.state.branches[exploration.branchId];
          
          // Get next branches if they exist
          const nextBranches = exploration.nextBranches.map(branchId => {
            return this.state.branches[branchId] || null;
          }).filter(branch => branch !== null);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                exploration,
                branch,
                nextBranches
              }, null, 2)
            }]
          };
        }
        
        case 'getScenarioTree': {
          const { scenarioId } = args as { scenarioId: string };
          
          if (!scenarioId || typeof scenarioId !== 'string') {
            throw new Error('Invalid scenarioId: must be a string');
          }
          
          if (!this.state.scenarios[scenarioId]) {
            throw new Error(`Scenario with ID ${scenarioId} does not exist`);
          }
          
          const scenario = this.state.scenarios[scenarioId];
          
          // Get all branches for this scenario
          const branches = Object.values(this.state.branches)
            .filter(branch => branch.parentScenarioId === scenarioId);
          
          // Build a tree structure
          type BranchTree = {
            branch: BranchData;
            explorations: ExplorationData[];
            children: BranchTree[];
          } | null;

          const buildBranchTree = (branchId: string): BranchTree => {
            const branch = this.state.branches[branchId];
            if (!branch) return null;
            
            const explorations = Object.values(this.state.explorations)
              .filter(exploration => exploration.branchId === branchId)
              .sort((a, b) => a.explorationStep - b.explorationStep);
            
            const childBranches: BranchTree[] = Object.values(this.state.branches)
              .filter(b => b.parentBranchId === branchId)
              .map((childBranch): BranchTree => buildBranchTree(childBranch.branchId))
              .filter((child): child is BranchTree => child !== null);
            
            return {
              branch,
              explorations,
              children: childBranches
            };
          };
          
          // Get root branches (those without a parent branch)
          const rootBranches = branches
            .filter(branch => !branch.parentBranchId)
            .map(branch => buildBranchTree(branch.branchId))
            .filter(tree => tree !== null);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                scenario,
                tree: rootBranches
              }, null, 2)
            }]
          };
        }
        
        case 'abandonBranch': {
          const { branchId, reason } = args as { branchId: string, reason: string };
          
          if (!branchId || typeof branchId !== 'string') {
            throw new Error('Invalid branchId: must be a string');
          }
          
          if (!reason || typeof reason !== 'string') {
            throw new Error('Invalid reason: must be a string');
          }
          
          if (!this.state.branches[branchId]) {
            throw new Error(`Branch with ID ${branchId} does not exist`);
          }
          
          this.state.branches[branchId].status = 'abandoned';
          this.state.branches[branchId].updatedAt = Date.now();
          
          if (!this.disableLogging) {
            console.error(chalk.red(`Abandoned branch ${branchId}: ${reason}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Branch ${branchId} abandoned: ${reason}`,
                branch: this.state.branches[branchId]
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
const BRANCHING_EXPLORATION_TOOL: Tool = {
  name: "branchingexploration",
  description: `A powerful tool for exploring multiple pathways or scenarios from a single point.
This tool helps analyze different possibilities and outcomes through a tree-like structure of branches.

When to use this tool:
- Exploring different possible solutions to a problem
- Analyzing "what-if" scenarios and their consequences
- Decision-making with multiple possible outcomes
- Planning for contingencies and alternative paths
- Exploring the implications of different assumptions
- Mapping out complex solution spaces
- Identifying optimal paths through a decision tree

Key features:
- Create scenarios with initial conditions and objectives
- Branch out into multiple pathways from any point
- Explore each branch with detailed steps
- Track probability and status of each branch
- Identify insights and outcomes for each exploration
- Visualize the complete tree of possibilities
- Support for abandoning unproductive branches
- Multi-level branching for complex scenario exploration`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "createScenario",
          "createBranch",
          "updateBranchStatus",
          "createExploration",
          "getScenarioDetails",
          "getBranchDetails",
          "getExplorationDetails",
          "getScenarioTree",
          "abandonBranch"
        ],
        description: "The branching exploration action to perform"
      },
      scenarioData: {
        type: "object",
        properties: {
          scenarioId: { 
            type: "string", 
            description: "Unique identifier for the scenario" 
          },
          scenarioName: { 
            type: "string", 
            description: "Name of the scenario" 
          },
          scenarioDescription: { 
            type: "string", 
            description: "Detailed description of the scenario" 
          },
          initialConditions: { 
            type: "string", 
            description: "Initial conditions or starting point" 
          },
          objectives: { 
            type: "array", 
            items: { type: "string" },
            description: "List of objectives or goals" 
          },
          constraints: { 
            type: "array", 
            items: { type: "string" },
            description: "List of constraints or limitations" 
          }
        },
        required: [
          "scenarioId",
          "scenarioName",
          "scenarioDescription",
          "initialConditions",
          "objectives"
        ]
      },
      branchData: {
        type: "object",
        properties: {
          branchId: {
            type: "string",
            description: "Unique identifier for the branch"
          },
          parentScenarioId: {
            type: "string",
            description: "ID of the parent scenario"
          },
          parentBranchId: {
            type: "string",
            description: "ID of the parent branch (if any)"
          },
          branchName: {
            type: "string",
            description: "Name of the branch"
          },
          branchDescription: {
            type: "string",
            description: "Detailed description of the branch"
          },
          branchConditions: {
            type: "string",
            description: "Conditions under which this branch is taken"
          },
          probability: {
            type: "number",
            description: "Probability of this branch (0-1)"
          },
          depth: {
            type: "number",
            description: "Depth of this branch in the tree"
          },
          status: {
            type: "string",
            enum: ["unexplored", "exploring", "completed", "abandoned"],
            description: "Current status of the branch"
          }
        },
        required: [
          "branchId",
          "parentScenarioId",
          "branchName",
          "branchDescription",
          "branchConditions",
          "probability",
          "depth",
          "status"
        ]
      },
      explorationData: {
        type: "object",
        properties: {
          explorationId: {
            type: "string",
            description: "Unique identifier for the exploration"
          },
          branchId: {
            type: "string",
            description: "ID of the branch being explored"
          },
          explorationStep: {
            type: "number",
            description: "Current step number in the exploration"
          },
          totalSteps: {
            type: "number",
            description: "Total steps planned for this exploration"
          },
          description: {
            type: "string",
            description: "Description of this exploration step"
          },
          outcome: {
            type: "string",
            description: "Outcome of this exploration step"
          },
          insights: {
            type: "array",
            items: { type: "string" },
            description: "Insights gained from this exploration"
          },
          nextBranches: {
            type: "array",
            items: { type: "string" },
            description: "IDs of branches that can be taken next"
          },
          isTerminal: {
            type: "boolean",
            description: "Whether this is a terminal exploration step"
          }
        },
        required: [
          "explorationId",
          "branchId",
          "explorationStep",
          "totalSteps",
          "description",
          "outcome",
          "insights",
          "nextBranches",
          "isTerminal"
        ]
      },
      scenarioId: {
        type: "string",
        description: "ID of the scenario to operate on"
      },
      branchId: {
        type: "string",
        description: "ID of the branch to operate on"
      },
      explorationId: {
        type: "string",
        description: "ID of the exploration to operate on"
      },
      status: {
        type: "string",
        enum: ["unexplored", "exploring", "completed", "abandoned"],
        description: "Status to set for a branch"
      },
      reason: {
        type: "string",
        description: "Reason for abandoning a branch"
      }
    },
    required: ["action"]
  }
};

// Server setup
const server = new Server(
  {
    name: "branching-exploration-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const branchingExplorationServer = new BranchingExplorationServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [BRANCHING_EXPLORATION_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "branchingexploration" && request.params.arguments) {
    return branchingExplorationServer.processRequest(
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
  console.error("Branching Exploration MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});