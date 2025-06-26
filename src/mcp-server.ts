import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { setupMinimalResource } from "./minimal/resource.js";
import { setupMinimalTool } from "./minimal/tool.js";
import { setupMinimalPrompt } from "./minimal/prompt.js";
import { setupBlenderTools } from "./blender/tools.js";
import { setupBlenderResources } from "./blender/resources.js";
/**
 * Creates and configures the minimal MCP server instance
 */
export function createMCPServer(): McpServer {
  const serverName = process.env.MCP_SERVER_NAME || "blender-mcp";
  const serverVersion = process.env.MCP_SERVER_VERSION || "1.0.0";
  
  // ... keep existing server creation code ...
  const server = new McpServer({
    name: serverName,
    version: serverVersion
  });
  // ... keep existing minimal capabilities registration ...
  setupMinimalResource(server);
  setupMinimalTool(server);
  setupMinimalPrompt(server);
  
  // Register Blender capabilities
  setupBlenderTools(server);
  setupBlenderResources(server);
  
  // ... rest of existing code ...
  return server;
}