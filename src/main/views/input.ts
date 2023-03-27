import { join } from 'path'
import { ViewContext } from '@common/@types/view'

const figure: ViewContext = {
  options: {
    alwaysOnTop: true,
    frame: false,
    fullscreenable: false,
    transparent: true,
    useContentSize: true,
    show: false,
    width: 320,
    height: 28,
    x: 48,
    y: 480,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      additionalArguments: ['text-input'],
    },
  },
}

export default figure
