import { MCPTool } from '@renderer/types'
import { describe, expect, it } from 'vitest'

import { AvailableTools, buildSystemPrompt } from '../prompt'

describe('prompt', () => {
  // Helper function: Create a tool object that conforms to MCPTool type
  const createMcpTool = (id: string, description: string, inputSchema: any): MCPTool => ({
    id,
    description,
    inputSchema,
    serverId: 'test-server-id',
    serverName: 'test-server',
    name: id
  })

  describe('AvailableTools', () => {
    it('should generate XML format for tools', () => {
      const tools = [createMcpTool('test-tool', 'Test tool description', { type: 'object' })]
      const result = AvailableTools(tools)

      expect(result).toContain('')
      expect(result).toContain('')
      expect(result).toContain('<tool>')
      expect(result).toContain('test-tool')
      expect(result).toContain('Test tool description')
      expect(result).toContain('{"type":"object"}')
    })

    it('should handle empty tools array', () => {
      const result = AvailableTools([])

      expect(result).toContain('')
      expect(result).toContain('')
      expect(result).not.toContain('<tool>')
    })
  })

  describe('buildSystemPrompt', () => {
    it('should build prompt with tools', () => {
      const userPrompt = 'Custom user system prompt'
      const tools = [createMcpTool('test-tool', 'Test tool description', { type: 'object' })]
      const result = buildSystemPrompt(userPrompt, tools)

      expect(result).toContain(userPrompt)
      expect(result).toContain('test-tool')
      expect(result).toContain('Test tool description')
    })

    it('should return user prompt without tools', () => {
      const userPrompt = 'Custom user system prompt'
      const result = buildSystemPrompt(userPrompt, [])

      expect(result).toBe(userPrompt)
    })

    it('should handle null userPrompt', () => {
      // Test when userPrompt is null
      const result = buildSystemPrompt(null as any, [])
      expect(result).toBe('')
    })

    it('should handle undefined userPrompt', () => {
      // Test when userPrompt is undefined
      const result = buildSystemPrompt(undefined as any, [])
      expect(result).toBe('')
    })
  })
})
