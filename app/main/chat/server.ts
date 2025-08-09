/* global Deno */

export interface Agent {
  id: string
  handle: (message: string) => AsyncIterable<string>
}

export class Conversation {
  #agents = new Map<string, Agent>()
  state: 'idle' | 'streaming' = 'idle'

  register(agent: Agent) {
    this.#agents.set(agent.id, agent)
  }

  async *route(agentId: string, message: string): AsyncIterable<string> {
    const agent = this.#agents.get(agentId)
    if (!agent) throw new Error(`Unknown agent: ${agentId}`)
    this.state = 'streaming'
    try {
      for await (const chunk of agent.handle(message)) {
        yield chunk
      }
    } finally {
      this.state = 'idle'
    }
  }
}

if (import.meta.main) {
  const conversation = new Conversation()
  conversation.register({
    id: 'echo',
    async *handle(message: string) {
      yield message
    }
  })

  const sockets = new Set<WebSocket>()

  Deno.serve((req) => {
    const { socket, response } = Deno.upgradeWebSocket(req)
    sockets.add(socket)

    socket.onmessage = async (ev) => {
      try {
        const data = JSON.parse(typeof ev.data === 'string' ? ev.data : '{}')
        const stream = conversation.route(data.agent, data.message)
        for await (const chunk of stream) {
          for (const ws of sockets) {
            ws.send(chunk)
          }
        }
      } catch (err) {
        socket.send(`error: ${(err as Error).message}`)
      }
    }

    socket.onclose = () => sockets.delete(socket)
    return response
  })
}
