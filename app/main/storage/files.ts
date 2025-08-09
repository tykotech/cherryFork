import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.resolve(process.cwd(), 'packages/database/data/uploads')

export async function uploadFile(filename: string, data: Buffer): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOAD_DIR, filename), data)
}

export async function listFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    return files
  } catch {
    return []
  }
}

export async function deleteFile(filename: string): Promise<void> {
  await fs.rm(path.join(UPLOAD_DIR, filename), { force: true })
}
