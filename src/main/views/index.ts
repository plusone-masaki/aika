import { join } from 'path'
import { BrowserWindow } from 'electron'
import { ViewContext } from '@common/@types/view'

// const displays = screen.getAllDisplays()

const index: ViewContext = {
  options: {
    alwaysOnTop: true,
    frame: false,
    fullscreen: true,
    transparent: true,
    resizable: false,
    useContentSize: false,
    hasShadow: false,
    skipTaskbar: true,
    show: false,
    vibrancy: 'light',
    // width: displays.reduce((width, display) => width + display.bounds.width, 0),
    // height: displays.reduce((width, display) => width + display.bounds.height, 0),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      additionalArguments: ['/'],
    },
  },
  hook: (window: BrowserWindow) => {
    window.on('ready-to-show', () => window.show())
    window.setIgnoreMouseEvents(true, { forward: true })
    window.setAlwaysOnTop(true, 'normal')
  },
}

export default index
