import { LocalProvider } from './LocalProvider'
import { OpenAIProvider } from './OpenAIProvider'
export type { Provider } from './Provider'
export { LocalProvider, OpenAIProvider }

export const providers = {
  local: LocalProvider,
  openai: OpenAIProvider
}
