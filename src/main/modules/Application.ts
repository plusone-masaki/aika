import { app, BrowserWindow, ipcMain } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import api from '@common/api'
import ViewFactory from '@main/modules/ViewFactory'
import ModelLoader from '@main/modules/ModelLoader'
import { AI } from '@main/modules/AI'

export default class Application {
  private readonly AI: AI
  private readonly viewFactory: ViewFactory
  private figureWindow!: BrowserWindow

  public constructor () {
    this.AI = new AI()
    this.viewFactory = new ViewFactory()

    // 各種イベントリスナの登録
    this.registerAppHandler()
    this.registerIpcHandler()
    this.registerIpcListener()
  }

  public registerAppHandler () {
    if (!app.requestSingleInstanceLock()) {
      app.quit()
    }

    app.on('ready', () => this.start())
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit') {
          app.quit()
        }
      })
    } else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }

  public registerIpcHandler () {
    ipcMain.handle(api.GET_MODEL_LIST, () => ['Haru'])
    ipcMain.handle(api.GET_MODEL_DATA, (_, name: string, filepath: string) => ModelLoader.load(name, filepath))
    ipcMain.handle(api.SEND_QUESTION, (_, message) => this.AI.sendQuestion(message))
  }

  public registerIpcListener () {
    ipcMain.on(api.CLICK_THROUGH, (_, enable: boolean) => {
      this.figureWindow.setIgnoreMouseEvents(enable, { forward: true })
    })
  }

  public async start () {
    installExtension(VUEJS_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))

    // ウィンドウの生成
    this.figureWindow = await this.viewFactory.create('figure')
  }
}
