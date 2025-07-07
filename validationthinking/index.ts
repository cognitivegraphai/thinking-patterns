#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from 'chalk';

interface ValidationData {
  validationFocus: string;
  validationTechnique: string;
  issuesFound?: string;
  confidenceLevel: string;
  validationDepth: string;
  needsDeeperValidation?: boolean;
  validationNumber: number;
  totalValidations: number;
  suggestions?: string;
  isFinalValidation: boolean;
}

class ValidationThinkingServer {
  private validationHistory: ValidationData[] = [];
  private disableValidationLogging: boolean;

  constructor() {
    this.disableValidationLogging = (process.env.DISABLE_VALIDATION_LOGGING || "").toLowerCase() === "true";
  }

  private validateValidationData(input: unknown): ValidationData {
    const data = input as Record<string, unknown>;

    if (!data.validationFocus || typeof data.validationFocus !== 'string') {
      throw new Error('Invalid validationFocus: must be a string');
    }
    if (!data.validationTechnique || typeof data.validationTechnique !== 'string') {
      throw new Error('Invalid validationTechnique: must be a string');
    }
    if (!data.confidenceLevel || typeof data.confidenceLevel !== 'string') {
      throw new Error('Invalid confidenceLevel: must be a string');
    }
    if (data.validationDepth && typeof data.validationDepth !== 'string') {
      throw new Error('Invalid validationDepth: must be a string');
    }
    if (!data.validationNumber || typeof data.validationNumber !== 'number') {
      throw new Error('Invalid validationNumber: must be a number');
    }
    if (!data.totalValidations || typeof data.totalValidations !== 'number') {
      throw new Error('Invalid totalValidations: must be a number');
    }
    if (typeof data.isFinalValidation !== 'boolean') {
      throw new Error('Invalid isFinalValidation: must be a boolean');
    }

    return {
      validationFocus: data.validationFocus as string,
      validationTechnique: data.validationTechnique as string,
      issuesFound: data.issuesFound as string | undefined,
      confidenceLevel: data.confidenceLevel as string,
      validationDepth: (data.validationDepth as string) || 'Surface',
      needsDeeperValidation: data.needsDeeperValidation as boolean | undefined,
      validationNumber: data.validationNumber as number,
      totalValidations: data.totalValidations as number,
      suggestions: data.suggestions as string | undefined,
      isFinalValidation: data.isFinalValidation as boolean,
    };
  }

  private formatValidation(validationData: ValidationData): string {
    const { 
      validationNumber, 
      totalValidations, 
      validationFocus, 
      validationTechnique, 
      validationDepth, 
      confidenceLevel, 
      issuesFound, 
      suggestions 
    } = validationData;

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

    let depthColor;
    switch (validationDepth) {
      case 'Deep':
        depthColor = chalk.blue;
        break;
      case 'Medium':
        depthColor = chalk.cyan;
        break;
      case 'Surface':
        depthColor = chalk.gray;
        break;
      default:
        depthColor = chalk.white;
    }

    const header = `${chalk.magenta('🔍 Validation')} ${validationNumber}/${totalValidations}: ${validationFocus}`;
    const technique = `${chalk.cyan('Technique:')} ${validationTechnique}`;
    const depth = `${chalk.cyan('Depth:')} ${depthColor(validationDepth)}`;
    const confidence = `${chalk.cyan('Confidence:')} ${confidenceColor(confidenceLevel)}`;
    
    let content = [header, technique, depth, confidence];
    
    if (issuesFound) {
      content.push(`${chalk.red('Issues:')} ${issuesFound}`);
    }
    
    if (suggestions) {
      content.push(`${chalk.green('Suggestions:')} ${suggestions}`);
    }
    
    const maxLength = Math.max(...content.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);

    let output = `\n┌${border}┐\n`;
    content.forEach(line => {
      output += `│ ${line.padEnd(maxLength)} │\n`;
    });
    output += `└${border}┘`;

    return output;
  }

  public processValidation(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateValidationData(input);

      if (validatedInput.validationNumber > validatedInput.totalValidations) {
        validatedInput.totalValidations = validatedInput.validationNumber;
      }

      this.validationHistory.push(validatedInput);

      if (!this.disableValidationLogging) {
        const formattedValidation = this.formatValidation(validatedInput);
        console.error(formattedValidation);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            validationNumber: validatedInput.validationNumber,
            totalValidations: validatedInput.totalValidations,
            needsDeeperValidation: validatedInput.needsDeeperValidation,
            isFinalValidation: validatedInput.isFinalValidation,
            validationHistoryLength: this.validationHistory.length
          }, null, 2)
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

const VALIDATION_THINKING_TOOL: Tool = {
  name: "validationthinking",
  description: `A rigorous validation tool for systematically reviewing, double-checking, and identifying inconsistencies in any content, solution, or reasoning process. This tool employs multiple validation techniques to ensure thoroughness and accuracy.

When to use this tool:
- Verifying solutions or answers
- Reviewing documents or code for errors
- Checking for logical inconsistencies
- Validating data or calculations
- Quality assurance processes
- Final review before submission/publication
- Cross-examining arguments or proofs

Key features:
- Employs multiple validation techniques (cross-checking, source verification, logic testing)
- Tracks identified issues systematically
- Maintains validation trail for accountability
- Can adjust validation depth as needed
- Supports both high-level and detailed reviews
- Provides confidence assessment for each validation
- Generates improvement suggestions when issues found

Validation techniques included:
1. Cross-referencing with known facts/sources
2. Logical consistency checking
3. Calculation verification
4. Contextual appropriateness review
5. Completeness assessment
6. Alternative approach comparison
7. Edge case testing
8. Assumption validation

Parameters explained:
- validation_focus: The specific aspect being validated
- validation_technique: Which technique(s) are being applied
- issues_found: Description of any inconsistencies/errors found
- confidence_level: Confidence in validity (High/Medium/Low)
- validation_depth: Current depth of validation (Surface/Medium/Deep)
- needs_deeper_validation: Flag if deeper examination needed
- validation_number: Current step in validation sequence
- total_validations: Estimated total validation steps needed
- suggestions: Improvement suggestions if issues found
- is_final_validation: Whether this is the concluding validation

You should:
1. Start with surface-level validation before diving deeper
2. Apply multiple techniques to each aspect
3. Clearly document any issues found
4. Provide specific improvement suggestions
5. Adjust validation depth based on findings
6. Maintain honest confidence assessments
7. Only conclude when all issues are resolved
8. Provide clear final validity determination`,
  inputSchema: {
    type: "object",
    properties: {
      validationFocus: {
        type: "string",
        description: "The specific aspect or component being validated"
      },
      validationTechnique: {
        type: "string",
        enum: [
          "Cross-referencing",
          "Logical consistency",
          "Calculation verification",
          "Contextual review",
          "Completeness check",
          "Alternative approach",
          "Edge case testing",
          "Assumption validation",
          "Multiple techniques"
        ],
        description: "Which validation technique(s) are being applied"
      },
      issuesFound: {
        type: "string",
        description: "Description of any inconsistencies, errors, or problems identified"
      },
      confidenceLevel: {
        type: "string",
        enum: ["High", "Medium", "Low"],
        description: "Confidence in the validity of the current aspect"
      },
      validationDepth: {
        type: "string",
        enum: ["Surface", "Medium", "Deep"],
        description: "Current depth of validation being applied"
      },
      needsDeeperValidation: {
        type: "boolean",
        description: "Whether deeper examination of this aspect is needed"
      },
      validationNumber: {
        type: "integer",
        description: "Current step in validation sequence",
        minimum: 1
      },
      totalValidations: {
        type: "integer",
        description: "Estimated total validation steps needed",
        minimum: 1
      },
      suggestions: {
        type: "string",
        description: "Improvement suggestions if issues were found"
      },
      isFinalValidation: {
        type: "boolean",
        description: "Whether this is the concluding validation step"
      }
    },
    required: [
      "validationFocus",
      "validationTechnique",
      "confidenceLevel",
      "validationNumber",
      "totalValidations",
      "isFinalValidation"
    ]
  }
};

const server = new Server(
  {
    name: "validation-thinking-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const validationServer = new ValidationThinkingServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [VALIDATION_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "validationthinking") {
    return validationServer.processValidation(request.params.arguments);
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
  console.error("Validation Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});