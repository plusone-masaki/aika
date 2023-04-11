import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import { ViewType, ViewContext } from '@common/@types/view'
import figure from '@main/views/index'

export default class ViewFactory {
  private readonly windows: Record<ViewType, ViewContext> = {
    figure,
    config: figure,
  }

  public create = async (key: ViewType) => {
    const context = this.windows[key]
    if (!context) throw Error(`Window type ${key} is not defined.`)

    const window = new BrowserWindow(context.options)
    if (context.hook) context.hook(window)

    if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
      await window.loadURL((process.env['ELECTRON_RENDERER_URL'] as string))
    } else {
      await window.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return window
  }
}
