# Model Context Protocol (MCP) Server Guide
## What is MCP?
Model Context Protocol (MCP) is an open standard that enables AI agents (LLMs) to interact securely and systematically with external APIs and data sources.
### Core Components
- **Resources**: Read-only data endpoints (config files, documentation, reports)
- **Tools**: Interactive functions that perform actions (API calls, calculations, database operations)
- **Prompts**: Reusable templates for AI interactions
## Server Types
### 1. Streamable HTTP Server
Best for remote deployments and web-based integrations.
### 2. SSE (Server-Sent Events) Server
Ideal for real-time streaming applications and live data feeds.
### 3. Stdio Server
Perfect for command-line tools and direct integrations.
## Quick Start
### Prerequisites
```bash
npm init -y
npm install @modelcontextprotocol/sdk@1.11.4 express zod
```
### Basic Echo Server (Streamable HTTP)
```typescript
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
const app = express();
app.use(express.json());
app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'EchoServer', version: '1.0.0' });
  
  server.tool('echo', { message: z.string() }, async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }]
  }));
  const transport = new StreamableHTTPServerTransport();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.listen(3000, () => console.log('✅ Echo MCP server running on port 3000'));
```
## Common Use Cases
### API Wrapper
Convert REST APIs into MCP tools for AI consumption.
### Database Integration
Expose database queries as MCP resources and tools.
### File System Access
Provide structured access to files and configurations.
### External Service Integration
Connect AI agents to third-party services securely.
## Development Workflow
1. **Design your tools/resources** - Define what functionality to expose
2. **Choose transport type** - Streamable HTTP, SSE, or Stdio
3. **Implement server logic** - Add tools, resources, and prompts
4. **Add validation** - Use Zod schemas for input validation
5. **Test thoroughly** - Use MCP Inspector for debugging
6. **Deploy** - Host your server and configure clients
## Best Practices
- Always validate inputs with Zod schemas
- Implement proper error handling
- Use descriptive names and documentation
- Keep tools focused and single-purpose
- Handle authentication securely
- Log important operations
## Testing
Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test and debug your MCP servers during development.
## Examples Repository
Check out practical examples:
- Weather API wrapper
- Database query tool
- File system explorer
- Authentication-enabled servers
## Need Help?
- Review the official MCP SDK documentation
- Use TypeScript for better development experience
- Start simple and gradually add complexity
- Test each component individually
Ready to build your MCP server? Let's start coding! 🚀