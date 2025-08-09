export interface Provider {
  /**
   * Send a complete prompt and resolve with the full response.
   */
  sendPrompt(prompt: string): Promise<string>

  /**
   * Stream tokens from the model for the given prompt.
   * The `onMessage` callback will be invoked with each new chunk.
   */
  streamResponse(prompt: string, onMessage: (chunk: string) => void): Promise<void>
}
