import { Provider } from './Provider'

export class LocalProvider implements Provider {
  async sendPrompt(prompt: string): Promise<string> {
    // Placeholder for local model integration
    void prompt
    return 'Local provider not implemented.'
  }

  async streamResponse(prompt: string, onMessage: (chunk: string) => void): Promise<void> {
    // Placeholder streaming implementation
    void prompt
    onMessage('Local provider not implemented.')
  }
}
