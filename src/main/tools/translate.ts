import type { Provider } from './provider'

export async function translate(provider: Provider, text: string, targetLanguage: string): Promise<string> {
  return provider.translate(text, targetLanguage)
}
