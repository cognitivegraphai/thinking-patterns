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
interface CritiqueData {
  ideaId: string;
  ideaContent: string;
  critiqueId: string;
  critiqueFocus: string;
  critiqueMethod: string;
  flawsIdentified: string[];
  severityLevel: "Low" | "Medium" | "High";
  confidenceLevel: "Low" | "Medium" | "High";
  critiqueNumber: number;
  totalCritiques: number;
  needsRevision: boolean;
  createdAt: number;
}

interface RevisionData {
  revisionId: string;
  parentCritiqueId: string;
  originalIdeaId: string;
  revisionContent: string;
  addressedFlaws: string[];
  improvementAreas: string[];
  revisionNumber: number;
  totalRevisions: number;
  isFinalRevision: boolean;
  createdAt: number;
}

interface CritiqueRevisionState {
  ideas: Record<string, string>;
  critiques: Record<string, CritiqueData>;
  revisions: Record<string, RevisionData>;
  currentCritiqueId: string | null;
  currentRevisionId: string | null;
}

class CritiqueRevisionServer {
  private state: CritiqueRevisionState;
  private disableLogging: boolean;

  constructor() {
    this.state = this.initializeState();
    this.disableLogging = (process.env.DISABLE_CRITIQUE_REVISION_LOGGING || "").toLowerCase() === "true";
  }

  private initializeState(): CritiqueRevisionState {
    return {
      ideas: {},
      critiques: {},
      revisions: {},
      currentCritiqueId: null,
      currentRevisionId: null
    };
  }

  private validateCritiqueData(input: unknown): CritiqueData {
    const data = input as Record<string, unknown>;
    
    if (!data.ideaId || typeof data.ideaId !== 'string') {
      throw new Error('Invalid ideaId: must be a string');
    }
    
    if (!data.ideaContent || typeof data.ideaContent !== 'string') {
      throw new Error('Invalid ideaContent: must be a string');
    }
    
    if (!data.critiqueId || typeof data.critiqueId !== 'string') {
      throw new Error('Invalid critiqueId: must be a string');
    }
    
    if (!data.critiqueFocus || typeof data.critiqueFocus !== 'string') {
      throw new Error('Invalid critiqueFocus: must be a string');
    }
    
    if (!data.critiqueMethod || typeof data.critiqueMethod !== 'string') {
      throw new Error('Invalid critiqueMethod: must be a string');
    }
    
    if (!data.flawsIdentified || !Array.isArray(data.flawsIdentified) || 
        !data.flawsIdentified.every(flaw => typeof flaw === 'string')) {
      throw new Error('Invalid flawsIdentified: must be an array of strings');
    }
    
    if (!data.severityLevel || typeof data.severityLevel !== 'string' || 
        !['Low', 'Medium', 'High'].includes(data.severityLevel as string)) {
      throw new Error('Invalid severityLevel: must be one of "Low", "Medium", "High"');
    }
    
    if (!data.confidenceLevel || typeof data.confidenceLevel !== 'string' || 
        !['Low', 'Medium', 'High'].includes(data.confidenceLevel as string)) {
      throw new Error('Invalid confidenceLevel: must be one of "Low", "Medium", "High"');
    }
    
    if (!data.critiqueNumber || typeof data.critiqueNumber !== 'number') {
      throw new Error('Invalid critiqueNumber: must be a number');
    }
    
    if (!data.totalCritiques || typeof data.totalCritiques !== 'number') {
      throw new Error('Invalid totalCritiques: must be a number');
    }
    
    if (typeof data.needsRevision !== 'boolean') {
      throw new Error('Invalid needsRevision: must be a boolean');
    }
    
    return {
      ideaId: data.ideaId as string,
      ideaContent: data.ideaContent as string,
      critiqueId: data.critiqueId as string,
      critiqueFocus: data.critiqueFocus as string,
      critiqueMethod: data.critiqueMethod as string,
      flawsIdentified: data.flawsIdentified as string[],
      severityLevel: data.severityLevel as "Low" | "Medium" | "High",
      confidenceLevel: data.confidenceLevel as "Low" | "Medium" | "High",
      critiqueNumber: data.critiqueNumber as number,
      totalCritiques: data.totalCritiques as number,
      needsRevision: data.needsRevision as boolean,
      createdAt: Date.now()
    };
  }

  private validateRevisionData(input: unknown): RevisionData {
    const data = input as Record<string, unknown>;
    
    if (!data.revisionId || typeof data.revisionId !== 'string') {
      throw new Error('Invalid revisionId: must be a string');
    }
    
    if (!data.parentCritiqueId || typeof data.parentCritiqueId !== 'string') {
      throw new Error('Invalid parentCritiqueId: must be a string');
    }
    
    if (!data.originalIdeaId || typeof data.originalIdeaId !== 'string') {
      throw new Error('Invalid originalIdeaId: must be a string');
    }
    
    if (!data.revisionContent || typeof data.revisionContent !== 'string') {
      throw new Error('Invalid revisionContent: must be a string');
    }
    
    if (!data.addressedFlaws || !Array.isArray(data.addressedFlaws) || 
        !data.addressedFlaws.every(flaw => typeof flaw === 'string')) {
      throw new Error('Invalid addressedFlaws: must be an array of strings');
    }
    
    if (!data.improvementAreas || !Array.isArray(data.improvementAreas) || 
        !data.improvementAreas.every(area => typeof area === 'string')) {
      throw new Error('Invalid improvementAreas: must be an array of strings');
    }
    
    if (!data.revisionNumber || typeof data.revisionNumber !== 'number') {
      throw new Error('Invalid revisionNumber: must be a number');
    }
    
    if (!data.totalRevisions || typeof data.totalRevisions !== 'number') {
      throw new Error('Invalid totalRevisions: must be a number');
    }
    
    if (typeof data.isFinalRevision !== 'boolean') {
      throw new Error('Invalid isFinalRevision: must be a boolean');
    }
    
    return {
      revisionId: data.revisionId as string,
      parentCritiqueId: data.parentCritiqueId as string,
      originalIdeaId: data.originalIdeaId as string,
      revisionContent: data.revisionContent as string,
      addressedFlaws: data.addressedFlaws as string[],
      improvementAreas: data.improvementAreas as string[],
      revisionNumber: data.revisionNumber as number,
      totalRevisions: data.totalRevisions as number,
      isFinalRevision: data.isFinalRevision as boolean,
      createdAt: Date.now()
    };
  }

  private formatCritique(critiqueData: CritiqueData): string {
    const { 
      critiqueNumber, 
      totalCritiques, 
      critiqueFocus, 
      critiqueMethod, 
      flawsIdentified, 
      severityLevel, 
      confidenceLevel,
      needsRevision
    } = critiqueData;
    
    let severityColor;
    switch (severityLevel) {
      case 'High':
        severityColor = chalk.red;
        break;
      case 'Medium':
        severityColor = chalk.yellow;
        break;
      case 'Low':
        severityColor = chalk.green;
        break;
      default:
        severityColor = chalk.white;
    }
    
    let confidenceColor;
    switch (confidenceLevel) {
      case 'High':
        confidenceColor = chalk.green;
        break;
      case 'Medium':
        confidenceColor = chalk.yellow;
        break;
      case 'Low':
        confidenceColor = chalk.red;
        break;
      default:
        confidenceColor = chalk.white;
    }
    
    const header = `${chalk.red('🔍 Critique')} ${critiqueNumber}/${totalCritiques}: ${critiqueFocus}`;
    const method = `${chalk.cyan('Method:')} ${critiqueMethod}`;
    const severity = `${chalk.cyan('Severity:')} ${severityColor(severityLevel)}`;
    const confidence = `${chalk.cyan('Confidence:')} ${confidenceColor(confidenceLevel)}`;
    const revision = `${chalk.cyan('Needs Revision:')} ${needsRevision ? chalk.yellow('Yes') : chalk.green('No')}`;
    
    let flawsList = '';
    if (flawsIdentified.length > 0) {
      flawsList = `${chalk.cyan('Flaws Identified:')}\n`;
      flawsIdentified.forEach((flaw, index) => {
        flawsList += `  ${index + 1}. ${flaw}\n`;
      });
    } else {
      flawsList = `${chalk.cyan('Flaws Identified:')} None`;
    }
    
    const content = [header, method, severity, confidence, revision, flawsList];
    const maxLength = Math.max(...content.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);
    
    let output = `\n┌${border}┐\n`;
    content.forEach(line => {
      if (line === flawsList && flawsIdentified.length > 0) {
        output += `│ ${line.split('\n')[0].padEnd(maxLength)} │\n`;
        flawsIdentified.forEach((flaw, index) => {
          output += `│   ${index + 1}. ${flaw.padEnd(maxLength - 5)} │\n`;
        });
      } else {
        output += `│ ${line.padEnd(maxLength)} │\n`;
      }
    });
    output += `└${border}┘`;
    
    return output;
  }

  private formatRevision(revisionData: RevisionData): string {
    const { 
      revisionNumber, 
      totalRevisions, 
      revisionContent, 
      addressedFlaws, 
      improvementAreas,
      isFinalRevision
    } = revisionData;
    
    const header = `${chalk.green('✏️ Revision')} ${revisionNumber}/${totalRevisions}`;
    const finalStatus = `${chalk.cyan('Final Revision:')} ${isFinalRevision ? chalk.green('Yes') : chalk.yellow('No')}`;
    const content = `${chalk.cyan('Content:')} ${revisionContent.length > 50 ? revisionContent.substring(0, 50) + '...' : revisionContent}`;
    
    let addressedFlawsList = '';
    if (addressedFlaws.length > 0) {
      addressedFlawsList = `${chalk.cyan('Addressed Flaws:')}\n`;
      addressedFlaws.forEach((flaw, index) => {
        addressedFlawsList += `  ${index + 1}. ${flaw}\n`;
      });
    } else {
      addressedFlawsList = `${chalk.cyan('Addressed Flaws:')} None`;
    }
    
    let improvementsList = '';
    if (improvementAreas.length > 0) {
      improvementsList = `${chalk.cyan('Improvement Areas:')}\n`;
      improvementAreas.forEach((area, index) => {
        improvementsList += `  ${index + 1}. ${area}\n`;
      });
    } else {
      improvementsList = `${chalk.cyan('Improvement Areas:')} None`;
    }
    
    const displayItems = [header, finalStatus, content, addressedFlawsList, improvementsList];
    const maxLength = Math.max(...displayItems.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);
    
    let output = `\n┌${border}┐\n`;
    displayItems.forEach(line => {
      if ((line === addressedFlawsList && addressedFlaws.length > 0) || 
          (line === improvementsList && improvementAreas.length > 0)) {
        output += `│ ${line.split('\n')[0].padEnd(maxLength)} │\n`;
        const items = line === addressedFlawsList ? addressedFlaws : improvementAreas;
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
        case 'createIdea': {
          const { ideaId, ideaContent } = args as { ideaId: string, ideaContent: string };
          
          if (!ideaId || typeof ideaId !== 'string') {
            throw new Error('Invalid ideaId: must be a string');
          }
          
          if (!ideaContent || typeof ideaContent !== 'string') {
            throw new Error('Invalid ideaContent: must be a string');
          }
          
          if (this.state.ideas[ideaId]) {
            throw new Error(`Idea with ID ${ideaId} already exists`);
          }
          
          this.state.ideas[ideaId] = ideaContent;
          
          if (!this.disableLogging) {
            console.error(chalk.green(`Created idea: ${ideaId}`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Idea ${ideaId} created successfully`,
                idea: {
                  ideaId,
                  ideaContent
                }
              }, null, 2)
            }]
          };
        }
        
        case 'createCritique': {
          const critiqueData = this.validateCritiqueData(args.critiqueData);
          
          if (this.state.critiques[critiqueData.critiqueId]) {
            throw new Error(`Critique with ID ${critiqueData.critiqueId} already exists`);
          }
          
          if (!this.state.ideas[critiqueData.ideaId]) {
            // Store the idea if it doesn't exist yet
            this.state.ideas[critiqueData.ideaId] = critiqueData.ideaContent;
          }
          
          this.state.critiques[critiqueData.critiqueId] = critiqueData;
          this.state.currentCritiqueId = critiqueData.critiqueId;
          
          if (!this.disableLogging) {
            console.error(this.formatCritique(critiqueData));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Critique ${critiqueData.critiqueId} created successfully`,
                critique: critiqueData
              }, null, 2)
            }]
          };
        }
        
        case 'createRevision': {
          const revisionData = this.validateRevisionData(args.revisionData);
          
          if (this.state.revisions[revisionData.revisionId]) {
            throw new Error(`Revision with ID ${revisionData.revisionId} already exists`);
          }
          
          if (!this.state.critiques[revisionData.parentCritiqueId]) {
            throw new Error(`Parent critique with ID ${revisionData.parentCritiqueId} does not exist`);
          }
          
          if (!this.state.ideas[revisionData.originalIdeaId]) {
            throw new Error(`Original idea with ID ${revisionData.originalIdeaId} does not exist`);
          }
          
          this.state.revisions[revisionData.revisionId] = revisionData;
          this.state.currentRevisionId = revisionData.revisionId;
          
          if (!this.disableLogging) {
            console.error(this.formatRevision(revisionData));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                message: `Revision ${revisionData.revisionId} created successfully`,
                revision: revisionData
              }, null, 2)
            }]
          };
        }
        
        case 'getIdeaDetails': {
          const { ideaId } = args as { ideaId: string };
          
          if (!ideaId || typeof ideaId !== 'string') {
            throw new Error('Invalid ideaId: must be a string');
          }
          
          if (!this.state.ideas[ideaId]) {
            throw new Error(`Idea with ID ${ideaId} does not exist`);
          }
          
          const ideaContent = this.state.ideas[ideaId];
          const critiques = Object.values(this.state.critiques)
            .filter(critique => critique.ideaId === ideaId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                idea: {
                  ideaId,
                  ideaContent
                },
                critiques
              }, null, 2)
            }]
          };
        }
        
        case 'getCritiqueDetails': {
          const { critiqueId } = args as { critiqueId: string };
          
          if (!critiqueId || typeof critiqueId !== 'string') {
            throw new Error('Invalid critiqueId: must be a string');
          }
          
          if (!this.state.critiques[critiqueId]) {
            throw new Error(`Critique with ID ${critiqueId} does not exist`);
          }
          
          const critique = this.state.critiques[critiqueId];
          const revisions = Object.values(this.state.revisions)
            .filter(revision => revision.parentCritiqueId === critiqueId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                critique,
                revisions
              }, null, 2)
            }]
          };
        }
        
        case 'getRevisionDetails': {
          const { revisionId } = args as { revisionId: string };
          
          if (!revisionId || typeof revisionId !== 'string') {
            throw new Error('Invalid revisionId: must be a string');
          }
          
          if (!this.state.revisions[revisionId]) {
            throw new Error(`Revision with ID ${revisionId} does not exist`);
          }
          
          const revision = this.state.revisions[revisionId];
          const parentCritique = this.state.critiques[revision.parentCritiqueId];
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                revision,
                parentCritique
              }, null, 2)
            }]
          };
        }
        
        case 'getCritiqueRevisionChain': {
          const { ideaId } = args as { ideaId: string };
          
          if (!ideaId || typeof ideaId !== 'string') {
            throw new Error('Invalid ideaId: must be a string');
          }
          
          if (!this.state.ideas[ideaId]) {
            throw new Error(`Idea with ID ${ideaId} does not exist`);
          }
          
          const ideaContent = this.state.ideas[ideaId];
          const critiques = Object.values(this.state.critiques)
            .filter(critique => critique.ideaId === ideaId);
          
          const revisionChains = critiques.map(critique => {
            const revisions = Object.values(this.state.revisions)
              .filter(revision => revision.parentCritiqueId === critique.critiqueId)
              .sort((a, b) => a.revisionNumber - b.revisionNumber);
            
            return {
              critique,
              revisions
            };
          });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'success',
                idea: {
                  ideaId,
                  ideaContent
                },
                critiqueRevisionChains: revisionChains
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
const CRITIQUE_REVISION_TOOL: Tool = {
  name: "critiquerevision",
  description: `A powerful tool for evaluating ideas for flaws and then refining them.
This tool helps analyze ideas through a structured critique process followed by targeted revisions.

When to use this tool:
- Evaluating proposals, designs, or solutions for potential issues
- Refining ideas based on identified flaws
- Improving the quality and robustness of concepts
- Testing assumptions and identifying weaknesses
- Iterative improvement of ideas through critique and revision cycles
- Quality assurance for important decisions or proposals

Key features:
- Systematic critique of ideas from multiple perspectives
- Identification of specific flaws with severity assessment
- Structured revision process to address identified issues
- Tracking of improvement areas and addressed flaws
- Support for multiple critique-revision cycles
- Confidence assessment for critiques
- Final revision status tracking`,
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "createIdea",
          "createCritique",
          "createRevision",
          "getIdeaDetails",
          "getCritiqueDetails",
          "getRevisionDetails",
          "getCritiqueRevisionChain"
        ],
        description: "The critique-revision action to perform"
      },
      ideaId: { 
        type: "string", 
        description: "Unique identifier for the idea" 
      },
      ideaContent: { 
        type: "string", 
        description: "Content of the idea to critique and revise" 
      },
      critiqueData: {
        type: "object",
        properties: {
          ideaId: { 
            type: "string", 
            description: "ID of the idea being critiqued" 
          },
          ideaContent: { 
            type: "string", 
            description: "Content of the idea being critiqued" 
          },
          critiqueId: { 
            type: "string", 
            description: "Unique identifier for this critique" 
          },
          critiqueFocus: { 
            type: "string", 
            description: "Specific aspect or focus of the critique" 
          },
          critiqueMethod: { 
            type: "string", 
            description: "Method or approach used for critique" 
          },
          flawsIdentified: { 
            type: "array", 
            items: { type: "string" },
            description: "List of specific flaws identified" 
          },
          severityLevel: { 
            type: "string", 
            enum: ["Low", "Medium", "High"],
            description: "Severity level of the identified flaws" 
          },
          confidenceLevel: { 
            type: "string", 
            enum: ["Low", "Medium", "High"],
            description: "Confidence in the critique assessment" 
          },
          critiqueNumber: { 
            type: "number", 
            description: "Current critique number in sequence" 
          },
          totalCritiques: { 
            type: "number", 
            description: "Total critiques planned" 
          },
          needsRevision: { 
            type: "boolean", 
            description: "Whether the idea needs revision based on this critique" 
          }
        },
        required: [
          "ideaId", 
          "ideaContent", 
          "critiqueId", 
          "critiqueFocus", 
          "critiqueMethod", 
          "flawsIdentified", 
          "severityLevel", 
          "confidenceLevel", 
          "critiqueNumber", 
          "totalCritiques", 
          "needsRevision"
        ]
      },
      revisionData: {
        type: "object",
        properties: {
          revisionId: { 
            type: "string", 
            description: "Unique identifier for this revision" 
          },
          parentCritiqueId: { 
            type: "string", 
            description: "ID of the critique this revision addresses" 
          },
          originalIdeaId: { 
            type: "string", 
            description: "ID of the original idea being revised" 
          },
          revisionContent: { 
            type: "string", 
            description: "Content of the revised idea" 
          },
          addressedFlaws: { 
            type: "array", 
            items: { type: "string" },
            description: "List of flaws addressed in this revision" 
          },
          improvementAreas: { 
            type: "array", 
            items: { type: "string" },
            description: "Areas of improvement in this revision" 
          },
          revisionNumber: { 
            type: "number", 
            description: "Current revision number in sequence" 
          },
          totalRevisions: { 
            type: "number", 
            description: "Total revisions planned" 
          },
          isFinalRevision: { 
            type: "boolean", 
            description: "Whether this is the final revision" 
          }
        },
        required: [
          "revisionId", 
          "parentCritiqueId", 
          "originalIdeaId", 
          "revisionContent", 
          "addressedFlaws", 
          "improvementAreas", 
          "revisionNumber", 
          "totalRevisions", 
          "isFinalRevision"
        ]
      },
      critiqueId: { 
        type: "string", 
        description: "ID of the critique to operate on" 
      },
      revisionId: { 
        type: "string", 
        description: "ID of the revision to operate on" 
      }
    },
    required: ["action"]
  }
};

// Server setup
const server = new Server(
  {
    name: "critique-revision-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const critiqueRevisionServer = new CritiqueRevisionServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CRITIQUE_REVISION_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "critiquerevision" && request.params.arguments) {
    return critiqueRevisionServer.processRequest(
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
  console.error("Critique-Revision MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});