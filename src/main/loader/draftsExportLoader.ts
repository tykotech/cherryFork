import * as fs from 'node:fs'

import { JsonLoader } from '@cherrystudio/embedjs'

/**
 * Drafts app exported note file loader
 * The original file is a JSON array. Only the fields content, tags, and modified_at are retained for each note.
 */
export class DraftsExportLoader extends JsonLoader {
  constructor(filePath: string) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const rawJson = JSON.parse(fileContent) as any[]
    const json = rawJson.map((item) => {
      return {
        content: item.content?.replace(/\n/g, '<br>'),
        tags: item.tags,
        modified_at: item.created_at
      }
    })
    super({ object: json })
  }
}
