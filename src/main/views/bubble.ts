import { join } from 'path'
import { ViewContext } from '@common/@types/view'

const figure: ViewContext = {
  options: {
    alwaysOnTop: true,
    frame: false,
    fullscreenable: false,
    transparent: true,
    useContentSize: true,
    width: 320,
    height: 120,
    x: 240,
    y: 80,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      additionalArguments: ['text-bubble'],
    },
  },
}

export default figure
