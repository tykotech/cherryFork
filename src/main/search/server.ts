import express from 'express'

import { createSearchProvider } from './ProviderFactory'

export function startSearchServer(port = 3030) {
  const app = express()
  app.use(express.json())

  app.post('/search/web', async (req, res) => {
    const { provider, query, maxResults = 5, contentLimit } = req.body || {}

    if (!provider || !provider.id || !query) {
      res.status(400).json({ error: 'Missing provider or query' })
      return
    }

    try {
      const searchProvider = createSearchProvider(provider)
      const result = await searchProvider.search(query, { maxResults, contentLimit })
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
  })

  app.listen(port, () => {
    console.log(`Search server listening on port ${port}`)
  })
}
