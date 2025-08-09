let pool: any = null

export async function connect(config: any): Promise<any> {
  if (!pool) {
    const { Pool } = await import('pg')
    pool = new Pool(config)
  }
  return pool
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  if (!pool) throw new Error('Postgres not connected')
  const res = await pool.query(text, params)
  return res.rows as T[]
}

export async function withClient<T>(fn: (client: any) => Promise<T>): Promise<T> {
  if (!pool) throw new Error('Postgres not connected')
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
