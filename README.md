# MCP Server Setup Guide
## What is MCP (Model Context Protocol)?
The Model Context Protocol (MCP) is an open standard that enables AI agents (LLMs) to interact systematically and securely with external APIs and data sources. It allows AI systems to invoke tools, retrieve structured data, and perform real-world tasks effectively.
### Core Components
- **Resources**: Read-only data endpoints (e.g., documentation pages, config files, weather reports)
- **Tools**: Interactive functions that can perform actions or computations (e.g., API calls, database operations)
- **Prompts**: Reusable templates that help LLMs interact with your server effectively
## Quick Start
### 1. Choose Your Transport Type
**Streamable HTTP** (Recommended for web applications)
- Best for remote servers and web integrations
- Supports both stateful and stateless operations
- Easy to deploy and scale
**SSE (Server-Sent Events)**
- For real-time streaming scenarios
- Good for live data feeds
**Stdio**
- For command-line tools and direct integrations
- Simple setup for local development
### 2. Installation
```bash
npm init -y
npm install @modelcontextprotocol/sdk@1.11.4 express zod
```
### 3. Basic Server Setup
#### Stateless Streamable HTTP Server
```javascript
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
const app = express();
app.use(express.json());
app.post('/mcp', async (req, res) => {
  const server = new McpServer({ 
    name: 'MyMCPServer', 
    version: '1.0.0' 
  });
  // Add your tools here
  server.tool('echo', 
    { message: z.string() }, 
    async ({ message }) => ({
      content: [{ type: 'text', text: `Echo: ${message}` }]
    })
  );
  const transport = new StreamableHTTPServerTransport();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
app.listen(3000, () => {
  console.log('✅ MCP server running on port 3000');
});
```
### 4. Converting APIs to MCP Tools
If you have existing CURL requests or APIs, they can easily be converted to MCP tools:
#### Example: REST API to MCP Tool
```javascript
// Your existing CURL:
// curl -X POST https://api.example.com/users \
//   -H "Authorization: Bearer TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"name": "John", "email": "john@example.com"}'
// Becomes this MCP tool:
server.tool('createUser', 
  { 
    name: z.string(), 
    email: z.string().email() 
  }, 
  async ({ name, email }) => {
    const response = await fetch('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    };
  }
);
```
## Getting Started Checklist
- [ ] Choose your transport type (Streamable HTTP recommended)
- [ ] Decide if you need stateful or stateless operations
- [ ] Gather your existing API endpoints/CURL commands
- [ ] Identify what data/functionality to expose
- [ ] Set up authentication (API keys, tokens, etc.)
- [ ] Install dependencies
- [ ] Create your first MCP server
- [ ] Test with MCP Inspector
## Need Help?
Share your:
1. Existing API endpoints or CURL commands
2. Authentication methods
3. What functionality you want to expose
4. Whether you need stateful or stateless operations
And I'll help you build a custom MCP server!
## Examples
- **Simple Echo Server**: Basic tool demonstration
- **Weather API Proxy**: REST API wrapper example  
- **Database Operations**: Stateful server with session management
- **File Operations**: Resource and tool combinations
Ready to build your MCP server? Let's convert your APIs into powerful AI-accessible tools! 🚀