import { Button, Input, List, Select, Spin } from 'antd'
import React, { useEffect, useState } from 'react'

import type { Assistant } from '../../types'

interface BackendMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const ChatPage: React.FC = () => {
  const [agents, setAgents] = useState<Assistant[]>([])
  const [activeAgent, setActiveAgent] = useState<string>()
  const [messages, setMessages] = useState<BackendMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()
        setAgents(data)
        setActiveAgent(data[0]?.id)
      } catch (e) {
        console.error(e)
      }
    }
    loadAgents()
  }, [])

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch('/api/messages')
        const data = await res.json()
        setMessages(data)
      } catch (e) {
        console.error(e)
      }
    }
    loadMessages()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || !activeAgent) return
    const userMsg: BackendMessage = { id: Date.now().toString(), role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setStreaming(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: activeAgent, message: input })
      })
      const data: BackendMessage = await res.json()
      setMessages((prev) => [...prev, data])
    } catch (e) {
      console.error(e)
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <Select
        style={{ width: 200, marginBottom: 16 }}
        value={activeAgent}
        onChange={setActiveAgent}
        placeholder="Select agent">
        {agents.map((a) => (
          <Select.Option key={a.id} value={a.id}>
            {a.name}
          </Select.Option>
        ))}
      </Select>
      <List
        bordered
        dataSource={messages}
        style={{ height: 300, overflowY: 'auto', marginBottom: 16 }}
        renderItem={(item) => (
          <List.Item>
            <strong>{item.role}:</strong>&nbsp;{item.content}
          </List.Item>
        )}
      />
      {streaming && (
        <div style={{ marginBottom: 8 }}>
          <Spin size="small" /> Streaming...
        </div>
      )}
      <Input.TextArea
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
      />
      <Button type="primary" onClick={handleSend} style={{ marginTop: 8 }}>
        Send
      </Button>
    </div>
  )
}

export default ChatPage
