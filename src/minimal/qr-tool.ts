import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import QRCode from "qrcode";
/**
 * Sets up the QR code generation tool
 */
export function setupQRTool(server: McpServer): void {
  server.registerTool(
    "generate_qr",
    {
      title: "QR Code Generator",
      description: "Generate QR codes from text and return as base64-encoded PNG images",
      inputSchema: {
        text: z.string().describe("The text to encode as QR code"),
        size: z.number().optional().describe("QR code size in pixels (default: 200)"),
        margin: z.number().optional().describe("Margin around QR code (default: 4)")
      }
    },
    async ({ text, size = 200, margin = 4 }) => {
      try {
        const qrOptions = {
          width: size,
          margin: margin,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        };
        const qrCodeDataURL = await QRCode.toDataURL(text, qrOptions);
        const base64Data = qrCodeDataURL.split(',')[1];
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              input: {
                text: text,
                size: size,
                margin: margin
              },
              output: {
                format: "PNG",
                encoding: "base64",
                data: base64Data,
                dataURL: qrCodeDataURL
              },
              metadata: {
                tool: "generate_qr",
                timestamp: new Date().toISOString()
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error occurred",
              input: { text, size, margin }
            }, null, 2)
          }]
        };
      }
    }
  );
}