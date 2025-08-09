/* global Deno */

import { assertEquals } from 'https://deno.land/std/assert/mod.ts'

import { Agent, Conversation } from './server.ts'

Deno.test('routes messages to registered agents and updates state', async () => {
  const conv = new Conversation()
  const upperAgent: Agent = {
    id: 'upper',
    async *handle(msg: string) {
      yield msg.toUpperCase()
    }
  }
  const lowerAgent: Agent = {
    id: 'lower',
    async *handle(msg: string) {
      yield msg.toLowerCase()
    }
  }
  conv.register(upperAgent)
  conv.register(lowerAgent)

  const stream = conv.route('upper', 'hello')
  const out: string[] = []
  for await (const chunk of stream) {
    assertEquals(conv.state, 'streaming')
    out.push(chunk)
  }
  assertEquals(out, ['HELLO'])
  assertEquals(conv.state, 'idle')

  const stream2 = conv.route('lower', 'WORLD')
  const out2: string[] = []
  for await (const chunk of stream2) {
    out2.push(chunk)
  }
  assertEquals(out2, ['world'])
})
