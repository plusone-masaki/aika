import { join } from 'path'
import { BrowserWindow } from 'electron'
import { ViewContext } from '@common/@types/view'

const figure: ViewContext = {
  options: {
    alwaysOnTop: true,
    frame: false,
    fullscreen: true,
    transparent: true,
    useContentSize: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      additionalArguments: ['figure'],
    },
  },
  hook: (window: BrowserWindow) => {
    window.on('ready-to-show', () => window.show())
    window.setIgnoreMouseEvents(true, { forward: true })
    window.setAlwaysOnTop(true, 'normal')
  },
}

export default figure
