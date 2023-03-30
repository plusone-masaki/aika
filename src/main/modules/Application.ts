import { app, BrowserWindow, ipcMain } from 'electron'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import api from '@common/api'
import ViewFactory from '@main/modules/ViewFactory'
import ModelLoader from '@main/modules/ModelLoader'
import AI from '@main/modules/AI'
import system from '../../common/system'
import VoiceVox from './VoiceVox'

export default class Application {
  private readonly AI: AI
  private readonly voiceVox: VoiceVox
  private readonly viewFactory: ViewFactory
  private figureWindow!: BrowserWindow

  public constructor () {
    this.AI = new AI()
    this.viewFactory = new ViewFactory()
    this.voiceVox = new VoiceVox()

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
    ipcMain.handle(api.GET_MODEL_LIST, () => ['Hiyori'])
    ipcMain.handle(api.GET_MODEL_DATA, (_, name: string, filepath: string) => ModelLoader.load(name, filepath))
    ipcMain.handle(api.SEND_MESSAGE, (_, message) => this.AI.sendMessage(message))
    ipcMain.handle(api.READ_MESSAGE, (_, message) => this.voiceVox.read(message))
  }

  public registerIpcListener () {
    ipcMain.on(system.CLICK_THROUGH, (_, enable: boolean) => {
      this.figureWindow.setIgnoreMouseEvents(enable, { forward: true })
    })
  }

  public async start () {
    this.voiceVox.initialize()
    installExtension(VUEJS_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))

    // ウィンドウの生成
    this.figureWindow = await this.viewFactory.create('figure')

    if (!app.isPackaged) {
      this.figureWindow.webContents.openDevTools()
    }
  }
}
