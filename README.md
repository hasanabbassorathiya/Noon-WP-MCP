# Noon-WP MCP Server

Production-ready MCP server for syncing Noon marketplace catalogs to WordPress.

## Architecture
- **Auth**: JWT-based service account flow.
- **Sync**: Noon Product Domain → WooCommerce REST API.
- **Config**: Environment variable management.

## Setup
1. `npm install`
2. `cp .env.example .env`
3. Populate `NOON_CLIENT_ID`, `NOON_CLIENT_SECRET`, `WP_API_URL`, `WP_API_KEY`.
4. `npm run build`
5. Register in Claude Code settings:
   ```json
   "noon-sync": {
     "command": "node",
     "args": ["/absolute/path/to/Noon-WP-MCP/dist/index.js"]
   }
   ```

## Development
- Build: `npm run build`
- Test: Modify `src/index.ts` to implement API integration.
