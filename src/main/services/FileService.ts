import fs from 'node:fs'

export default class FileService {
  public static async readFile(_: Electron.IpcMainInvokeEvent, filePath: string) {
    return fs.readFileSync(filePath, 'utf8')
  }
}
