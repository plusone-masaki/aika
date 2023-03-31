import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron'
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

  private createTray () {
    const trayIcon = new Tray(nativeImage.createFromPath(__dirname + '/favicon.ico'))
    const contextMenu = Menu.buildFromTemplate([
      { label: '表示', click: () => this.figureWindow.show() },
      { label: '隠す', click: () => this.figureWindow.hide() },
      { label: '終了', click: () => this.figureWindow.close() },
    ])
    trayIcon.setContextMenu(contextMenu)
    trayIcon.setToolTip(app.getName())
    trayIcon.on('click', () => this.figureWindow.show())
  }

  private registerAppHandler () {
    if (!app.requestSingleInstanceLock()) {
      app.exit()
    }

    app.on('ready', () => this.start())
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
    app.on('will-quit', () => {
      this.voiceVox.down()
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

  private registerIpcHandler () {
    ipcMain.handle(api.GET_MODEL_LIST, () => ['Hiyori'])
    ipcMain.handle(api.GET_MODEL_DATA, (_, name: string, filepath: string) => ModelLoader.load(name, filepath))
    ipcMain.handle(api.SEND_MESSAGE, (_, message) => this.AI.sendMessage(message))
    ipcMain.handle(api.READ_MESSAGE, (_, message) => this.voiceVox.read(message))
  }

  private registerIpcListener () {
    ipcMain.on(system.CLICK_THROUGH, (_, enable: boolean) => {
      this.figureWindow.setIgnoreMouseEvents(enable, { forward: true })
    })
  }

  public async start () {
    // 音声読み上げ機能の初期化
    await this.voiceVox.initialize()
    this.voiceVox.up()

    // アプリをタスクトレイに格納
    this.createTray()

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
