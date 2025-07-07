# Validation Thinking MCP Server

An MCP server implementation that provides a tool for rigorous validation, systematic reviewing, and identifying inconsistencies in any content, solution, or reasoning process.

## Features

- Systematically review and validate solutions, documents, or reasoning
- Apply multiple validation techniques to ensure thoroughness
- Track identified issues and provide improvement suggestions
- Adjust validation depth based on findings
- Provide confidence assessments for each validation step
- Support both high-level and detailed reviews

## Tool

### validation_thinking

Facilitates a rigorous, multi-technique validation process for quality assurance and error detection.

**Inputs:**
- `validationFocus` (string): The specific aspect or component being validated
- `validationTechnique` (string): Which validation technique(s) are being applied
- `confidenceLevel` (string): Confidence in the validity of the current aspect (High/Medium/Low)
- `validationDepth` (string, optional): Current depth of validation being applied (Surface/Medium/Deep)
- `needsDeeperValidation` (boolean, optional): Whether deeper examination of this aspect is needed
- `validationNumber` (integer): Current step in validation sequence
- `totalValidations` (integer): Estimated total validation steps needed
- `issuesFound` (string, optional): Description of any inconsistencies, errors, or problems identified
- `suggestions` (string, optional): Improvement suggestions if issues were found
- `isFinalValidation` (boolean): Whether this is the concluding validation step

## Usage

The Validation Thinking tool is designed for:
- Verifying solutions or answers
- Reviewing documents or code for errors
- Checking for logical inconsistencies
- Validating data or calculations
- Quality assurance processes
- Final review before submission/publication
- Cross-examining arguments or proofs

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### npx

```json
{
  "mcpServers": {
    "validation-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-validation-thinking"
      ]
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "validationthinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/validationthinking"
      ]
    }
  }
}
```

To disable logging of validation information set env var: `DISABLE_VALIDATION_LOGGING` to `true`.

### Usage with VS Code

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.

For NPX installation:

```json
{
  "mcp": {
    "servers": {
      "validation-thinking": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-validation-thinking"
        ]
      }
    }
  }
}
```

For Docker installation:

```json
{
  "mcp": {
    "servers": {
      "validation-thinking": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "mcp/validationthinking"
        ]
      }
    }
  }
}
```

## Building

Docker:

```bash
docker build -t mcp/validationthinking -f src/validationthinking/Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.