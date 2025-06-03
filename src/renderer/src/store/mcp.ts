import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import Logger from '@renderer/config/logger'
import type { MCPConfig, MCPServer } from '@renderer/types'

export const initialState: MCPConfig = {
  servers: []
}

const mcpSlice = createSlice({
  name: 'mcp',
  initialState,
  reducers: {
    setMCPServers: (state, action: PayloadAction<MCPServer[]>) => {
      state.servers = action.payload
    },
    addMCPServer: (state, action: PayloadAction<MCPServer>) => {
      state.servers.unshift(action.payload)
    },
    updateMCPServer: (state, action: PayloadAction<MCPServer>) => {
      const index = state.servers.findIndex((server) => server.id === action.payload.id)
      if (index !== -1) {
        state.servers[index] = action.payload
      }
    },
    deleteMCPServer: (state, action: PayloadAction<string>) => {
      state.servers = state.servers.filter((server) => server.id !== action.payload)
    },
    setMCPServerActive: (state, action: PayloadAction<{ id: string; isActive: boolean }>) => {
      const index = state.servers.findIndex((server) => server.id === action.payload.id)
      if (index !== -1) {
        state.servers[index].isActive = action.payload.isActive
      }
    }
  },
  selectors: {
    getActiveServers: (state) => {
      return state.servers.filter((server) => server.isActive)
    },
    getAllServers: (state) => state.servers
  }
})

export const { setMCPServers, addMCPServer, updateMCPServer, deleteMCPServer, setMCPServerActive } = mcpSlice.actions

// Export the generated selectors from the slice
export const { getActiveServers, getAllServers } = mcpSlice.selectors

// Type-safe selector for accessing this slice from the root state
export const selectMCP = (state: { mcp: MCPConfig }) => state.mcp

export { mcpSlice }
// Export the reducer as default export
export default mcpSlice.reducer

export const builtinMCPServers: MCPServer[] = [
  {
    id: nanoid(),
    name: '@cherry/mcp-auto-install',
    description: 'Automatically install MCP service (Beta) https://docs.cherry-ai.com/advanced-basic/mcp/auto-install',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@mcpmarket/mcp-auto-install', 'connect', '--json'],
    isActive: false,
    provider: 'CherryAI'
  },
  {
    id: nanoid(),
    name: '@cherry/memory',
    type: 'inMemory',
    description:
      'A persistent memory implementation based on local knowledge graph. This allows the model to remember relevant user information across different conversations. Requires MEMORY_FILE_PATH environment variable. https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    isActive: true,
    env: {
      MEMORY_FILE_PATH: 'YOUR_MEMORY_FILE_PATH'
    },
    provider: 'CherryAI'
  },
  {
    id: nanoid(),
    name: '@cherry/sequentialthinking',
    type: 'inMemory',
    description:
      'An MCP server implementation that provides tools for dynamic and reflective problem solving through structured thinking processes',
    isActive: true,
    provider: 'CherryAI'
  },
  {
    id: nanoid(),
    name: '@cherry/brave-search',
    type: 'inMemory',
    description:
      'An MCP server implementation integrated with Brave Search API, providing both web and local search functionality. Requires BRAVE_API_KEY environment variable',
    isActive: false,
    env: {
      BRAVE_API_KEY: 'YOUR_API_KEY'
    },
    provider: 'CherryAI'
  },
  {
    id: nanoid(),
    name: '@cherry/fetch',
    type: 'inMemory',
    description: 'An MCP server for fetching URL web page content',
    isActive: true,
    provider: 'CherryAI'
  },
  {
    id: nanoid(),
    name: '@cherry/filesystem',
    type: 'inMemory',
    description: 'A Node.js server for Model Context Protocol (MCP) implementing file system operations',
    isActive: false,
    provider: 'CherryAI'
  },
  {
    id: nanoid(),
    name: '@cherry/dify-knowledge',
    type: 'inMemory',
    description: 'Dify MCP server implementation, providing a simple API to interact with Dify',
    isActive: false,
    env: {
      DIFY_KEY: 'YOUR_DIFY_KEY'
    },
    provider: 'CherryAI'
  }
]

/**
 * Utility function to add servers to the MCP store during app initialization
 * @param servers Array of MCP servers to add
 * @param dispatch Redux dispatch function
 */
export const initializeMCPServers = (existingServers: MCPServer[], dispatch: (action: any) => void): void => {
  // Check if the existing servers already contain the built-in servers
  const serverIds = new Set(existingServers.map((server) => server.name))

  // Filter out any built-in servers that are already present
  const newServers = builtinMCPServers.filter((server) => !serverIds.has(server.name))

  Logger.log('[initializeMCPServers] Adding new servers:', newServers)
  // Add the new built-in servers to the existing servers
  newServers.forEach((server) => {
    dispatch(addMCPServer(server))
  })
}
