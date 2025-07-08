# Critique-Revision MCP Server

An MCP server for evaluating ideas for flaws and then refining them through a structured critique-revision process.

## Overview

The Critique-Revision server provides a structured approach to improving ideas through a two-phase process:

1. **Critique Phase**: Systematically evaluate an idea to identify specific flaws, weaknesses, or areas for improvement
2. **Revision Phase**: Refine the original idea by addressing the identified flaws and making targeted improvements

This approach is particularly useful for:
- Improving the quality and robustness of proposals or solutions
- Identifying potential issues before implementation
- Refining ideas through multiple iterations
- Testing assumptions and identifying weaknesses
- Quality assurance for important decisions

## Features

- Systematic critique of ideas from multiple perspectives
- Identification of specific flaws with severity assessment
- Structured revision process to address identified issues
- Tracking of improvement areas and addressed flaws
- Support for multiple critique-revision cycles
- Confidence assessment for critiques
- Final revision status tracking

## Usage

### Installation

```bash
npm install -g @cognitivegraphai/critique-revision
```

### Running the Server

```bash
npx @cognitivegraphai/critique-revision
```

## API

The server provides the following actions:

### `createIdea`

Create a new idea to be critiqued and revised.

```json
{
  "action": "createIdea",
  "ideaId": "idea-123",
  "ideaContent": "The content of the idea to critique and revise"
}
```

### `createCritique`

Create a critique of an idea, identifying specific flaws.

```json
{
  "action": "createCritique",
  "critiqueData": {
    "ideaId": "idea-123",
    "ideaContent": "The content of the idea being critiqued",
    "critiqueId": "critique-456",
    "critiqueFocus": "Feasibility",
    "critiqueMethod": "Cost-benefit analysis",
    "flawsIdentified": [
      "Requires too many resources",
      "Timeline is unrealistic"
    ],
    "severityLevel": "Medium",
    "confidenceLevel": "High",
    "critiqueNumber": 1,
    "totalCritiques": 3,
    "needsRevision": true
  }
}
```

### `createRevision`

Create a revision of an idea based on a critique.

```json
{
  "action": "createRevision",
  "revisionData": {
    "revisionId": "revision-789",
    "parentCritiqueId": "critique-456",
    "originalIdeaId": "idea-123",
    "revisionContent": "The revised content addressing the identified flaws",
    "addressedFlaws": [
      "Requires too many resources",
      "Timeline is unrealistic"
    ],
    "improvementAreas": [
      "Resource allocation",
      "Project timeline"
    ],
    "revisionNumber": 1,
    "totalRevisions": 2,
    "isFinalRevision": false
  }
}
```

### `getIdeaDetails`

Get details about an idea and its critiques.

```json
{
  "action": "getIdeaDetails",
  "ideaId": "idea-123"
}
```

### `getCritiqueDetails`

Get details about a critique and its revisions.

```json
{
  "action": "getCritiqueDetails",
  "critiqueId": "critique-456"
}
```

### `getRevisionDetails`

Get details about a revision and its parent critique.

```json
{
  "action": "getRevisionDetails",
  "revisionId": "revision-789"
}
```

### `getCritiqueRevisionChain`

Get the complete chain of critiques and revisions for an idea.

```json
{
  "action": "getCritiqueRevisionChain",
  "ideaId": "idea-123"
}
```

## License

MIT