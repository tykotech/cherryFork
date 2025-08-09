import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

export function createMcpServer() {
  const server = new McpServer({
    name: 'cherry-mcp',
    version: '0.1.0'
  })

  server.tool('echo', { text: z.string() }, async ({ text }) => ({
    content: [{ type: 'text', text }]
  }))

  return server
}

export async function startMcpServer() {
  const server = createMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  return server
}

if (require.main === module) {
  startMcpServer().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
