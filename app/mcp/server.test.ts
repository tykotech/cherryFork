//@vitest-environment node
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { describe, expect, it } from 'vitest'

import { createMcpServer } from './server'

class MemoryTransport implements Transport {
  peer?: MemoryTransport
  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void
  async start() {
    /* noop */
  }
  async send(message: JSONRPCMessage) {
    this.peer?.onmessage?.(message)
  }
  async close() {
    this.onclose?.()
  }
}

function createPair(): [MemoryTransport, MemoryTransport] {
  const a = new MemoryTransport()
  const b = new MemoryTransport()
  a.peer = b
  b.peer = a
  return [a, b]
}

describe('MCP server', () => {
  it('handles basic protocol flow', async () => {
    const server = createMcpServer()
    const client = new Client({ name: 'test-client', version: '1.0.0' })
    const [serverTrans, clientTrans] = createPair()

    await server.connect(serverTrans)
    await client.connect(clientTrans)

    const { tools } = await client.listTools({})
    expect(tools.some((t) => t.name === 'echo')).toBe(true)

    const resp = await client.callTool({ name: 'echo', arguments: { text: 'hi' } })
    expect(resp.content?.[0]?.text).toBe('hi')

    await client.ping()

    await client.close()
    await server.close()
  })
})
