export interface Provider {
  summarize(text: string): Promise<string>
  translate(text: string, targetLanguage: string): Promise<string>
}

export type ProviderCommand = (provider: Provider, ...args: any[]) => Promise<any>
