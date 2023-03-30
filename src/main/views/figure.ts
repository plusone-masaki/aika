import { join } from 'path'
import { ViewContext } from '@common/@types/view'

const figure: ViewContext = {
  options: {
    alwaysOnTop: true,
    frame: false,
    fullscreen: true,
    transparent: true,
    useContentSize: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      additionalArguments: ['figure'],
    },
  },
  hook: (window) => {
    window.setIgnoreMouseEvents(true, { forward: true })
    window.setAlwaysOnTop(true, 'normal')
  },
}

export default figure
