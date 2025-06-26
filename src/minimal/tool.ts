import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Sets up the echo tool
 */
export function setupMinimalTool(server: McpServer): void {
  server.registerTool(
    "echo",
    {
      title: "Echo Tool",
      description: "Echoes back the provided message",
      inputSchema: {
        message: z.string().describe("The message to echo back")
      }
    },
    async ({ message }) => {
      return {
        content: [{
          type: "text",
          text: `Echo: ${message}`
        }]
      };
    }
  );
}
