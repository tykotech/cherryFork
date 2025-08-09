# Built-in Tools

TykoTech exposes reusable tools that follow a simple command pattern. Each tool
expects a `Provider` implementation that supplies the actual summarization or
translation logic.

## Example

```ts
import { execute } from '@main/tools'
import type { Provider } from '@main/tools/provider'

const provider: Provider = {
  summarize: async (text) => `summary: ${text}`,
  translate: async (text, target) => `${text} -> ${target}`
}

const summary = await execute('summarize', provider, 'Long text to summarize')
const french = await execute('translate', provider, 'Hello world', 'fr')
```
