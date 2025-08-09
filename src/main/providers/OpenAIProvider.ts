import { Provider } from './Provider'

interface OpenAIOptions {
  apiKey: string
  model?: string
}

export class OpenAIProvider implements Provider {
  private readonly endpoint = 'https://api.openai.com/v1/chat/completions'
  private readonly model: string

  constructor(private readonly options: OpenAIOptions) {
    this.model = options.model ?? 'gpt-4o-mini'
  }

  async sendPrompt(prompt: string): Promise<string> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  async streamResponse(prompt: string, onMessage: (chunk: string) => void): Promise<void> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    })

    const reader = res.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const text = json.choices?.[0]?.delta?.content
          if (text) onMessage(text)
        } catch {
          // ignore malformed json
        }
      }
    }
  }
}
