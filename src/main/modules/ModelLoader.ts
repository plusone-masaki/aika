import { join, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { app } from 'electron'

export default class ModelLoader {
  public static load (name: string, filepath: string) {
    // ディレクトリトラバーサル対策
    name = name.replace('..', '')
    filepath = filepath.replace('..', '')

    const path = app.isPackaged
      ? join(__dirname, '..', '..', 'resources', name, filepath)
      : resolve('resources', name, filepath)
    if (!existsSync(path)) throw new Error(`File ${path} is not found.${__dirname}`)

    return readFileSync(path)
  }
}
