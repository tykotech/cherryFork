import { promises as fs } from 'fs'
import path from 'path'

const KV_FILE = path.resolve(process.cwd(), 'packages/database/data/kv.json')

interface KVRecord {
  [key: string]: unknown
}

let cache: KVRecord | null = null

async function load(): Promise<KVRecord> {
  if (cache) return cache
  try {
    const content = await fs.readFile(KV_FILE, 'utf-8')
    cache = JSON.parse(content)
  } catch {
    cache = {}
  }
  return cache!
}

export async function get(key: string): Promise<unknown> {
  const data = await load()
  return data[key]
}

export async function set(key: string, value: unknown): Promise<void> {
  const data = await load()
  data[key] = value
  await fs.mkdir(path.dirname(KV_FILE), { recursive: true })
  await fs.writeFile(KV_FILE, JSON.stringify(data, null, 2))
}

export async function del(key: string): Promise<void> {
  const data = await load()
  delete data[key]
  await fs.writeFile(KV_FILE, JSON.stringify(data, null, 2))
}

export async function list(): Promise<string[]> {
  const data = await load()
  return Object.keys(data)
}
