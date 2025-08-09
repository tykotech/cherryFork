import type { Provider, ProviderCommand } from './provider'
import { summarize } from './summarize'
import { translate } from './translate'

const commands: Record<string, ProviderCommand> = {
  summarize: (provider: Provider, text: string) => summarize(provider, text),
  translate: (provider: Provider, text: string, target: string) => translate(provider, text, target)
}

export function execute(command: string, ...args: any[]): Promise<any> {
  const cmd = commands[command]
  if (!cmd) {
    return Promise.reject(new Error(`Unknown command: ${command}`))
  }
  return cmd(...(args as [Provider, ...any[]]))
}

export { commands, summarize, translate }
