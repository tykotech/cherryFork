import OpenAI from 'openai'

import { query } from './postgres'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
  return res.data[0].embedding
}

export async function storeEmbedding(text: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const embedding = await embed(text)
  await query('INSERT INTO vectors (content, embedding, metadata) VALUES ($1, $2, $3)', [text, embedding, metadata])
}

export async function searchEmbedding(
  text: string,
  limit = 5
): Promise<{ content: string; metadata: unknown; score: number }[]> {
  const embedding = await embed(text)
  const rows = await query<{ content: string; metadata: unknown; score: number }>(
    'SELECT content, metadata, 1 - (embedding <=> $1) AS score FROM vectors ORDER BY embedding <=> $1 ASC LIMIT $2',
    [embedding, limit]
  )
  return rows
}
