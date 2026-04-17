import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const server = new Server(
  { name: "noon-wp-mcp-server", version: "1.2.0" },
  { capabilities: { tools: {} } }
);

const log = (msg: string) => console.error(`[MCP] ${msg}`);

const noonApi = axios.create({ baseURL: "https://api.noon.com/v1" });
const wpApi = axios.create({
  baseURL: process.env.WP_API_URL,
  headers: { 'Authorization': `Basic ${Buffer.from(process.env.WP_API_KEY || '').toString('base64')}` }
});

async function getNoonToken() {
  log("Auth [start]");
  const res = await noonApi.post("/auth/token", {
    client_id: process.env.NOON_CLIENT_ID,
    client_secret: process.env.NOON_CLIENT_SECRET
  });
  return res.data.token;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_noon_products",
      description: "Audit: List products from Noon",
      inputSchema: { type: "object", properties: { limit: { type: "integer", default: 10 } } }
    },
    {
      name: "sync_noon_products",
      description: "Sync catalog: Noon → WP",
      inputSchema: { type: "object", properties: { limit: { type: "integer", default: 10 } } }
    },
    {
      name: "list_noon_categories",
      description: "Audit: List categories",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const token = await getNoonToken();
    const args = z.object({ limit: z.number().default(10) }).parse(request.params.arguments || {});

    if (request.params.name === "list_noon_products") {
      const { data } = await noonApi.get("/products", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: args.limit }
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "sync_noon_products") {
      log(`Sync [start]: limit ${args.limit}`);
      const { data: products } = await noonApi.get("/products", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: args.limit }
      });

      let success = 0;
      for (const p of products) {
        try {
          await wpApi.post("/products", { name: p.name, regular_price: p.price.toString(), description: p.description });
          success++;
        } catch (e) { log(`Sync [fail]: ${p.name} - ${e}`); }
      }
      return { content: [{ type: "text", text: `Sync [done]: ${success}/${products.length} products.` }] };
    }

    if (request.params.name === "list_noon_categories") {
        const { data } = await noonApi.get("/categories", { headers: { Authorization: `Bearer ${token}` } });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }

    throw new Error("Tool unknown");
  } catch (e) {
    log(`Runtime [fail]: ${e}`);
    return { content: [{ type: "text", text: `Error: ${e}` }] };
  }
});

await server.connect(new StdioServerTransport());
