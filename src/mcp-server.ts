import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { setupMinimalTool } from "./minimal/tool.js";

/**
 * Creates and configures the echo MCP server instance
 */
export function createMCPServer(): McpServer {
  const serverName = process.env.MCP_SERVER_NAME || "echo-mcp";
  const serverVersion = process.env.MCP_SERVER_VERSION || "1.0.0";
  
  console.log(`🔧 Creating MCP server: ${serverName} v${serverVersion}`);
  
  // Create the MCP server instance
  const server = new McpServer({
    name: serverName,
    version: serverVersion
  });
  
  console.log("📦 Registering minimal MCP capabilities...");
  
  // Register only the echo tool
  setupMinimalTool(server);
  console.log("✅ Tool registered: echo");
  
  console.log("🎉 Minimal MCP server configuration completed");
  
  return server;
}
