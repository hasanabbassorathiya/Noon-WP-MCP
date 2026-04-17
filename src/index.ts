import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const server = new Server(
  { name: "noon-wp-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Auth Interceptor for JWT
const noonClient = axios.create({ baseURL: "https://api.noon.com/v1" });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "sync_noon_products",
      description: "Sync product catalog from Noon to WordPress",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "integer", default: 10 }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sync_noon_products") {
    // 1. Get Noon Products (Logic stub)
    // 2. Format for WooCommerce
    // 3. Post to WP REST API
    return { content: [{ type: "text", text: "Sync complete: 0 products processed (logic implementation required)." }] };
  }
  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
