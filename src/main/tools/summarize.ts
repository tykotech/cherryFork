import type { Provider } from './provider'

export async function summarize(provider: Provider, text: string): Promise<string> {
  return provider.summarize(text)
}
