import { ChildProcess, exec } from 'child_process'
import { join, resolve } from 'path'
import * as qs from 'querystring'
// import download from 'download'
import { app } from 'electron'
import axios from 'axios'

export default class VoiceVox {
  private readonly baseUrl = 'http://localhost:50021'
  // private readonly apiRepository = 'https://api.github.com/repos/VOICEVOX'
  private process?: ChildProcess

  public async initialize () {
    await this.up()
  }

  public async read (text: string) {
    try {
      // クエリ作成
      const speaker = 0
      const message = {
        text,
        speaker,
      }
      const res = await axios.post(`${this.baseUrl}/audio_query?${qs.stringify(message)}`)

      // 音声合成
      const voice = await axios.post(`${this.baseUrl}/synthesis?speaker=${speaker}`, res.data)
      return voice
    } catch (e) {
      console.error('VOICEVOX ERROR!: ', e)
      throw e
    }
  }

  public up () {
    const path = app.isPackaged
      ? join(__dirname, '..', '..', 'resources', 'voicevox', 'voicevox_engine', 'run.exe')
      : resolve('resources', 'voicevox', 'voicevox_engine', 'run.exe')
    this.process = exec(path)
  }

  public down () {
    if (this.process?.pid) {
      process.kill(this.process.pid)
    }
  }

  // private async downloadCoreLibrary () {
  //   // コアライブラリのダウンロード
  //   let fileName = ''
  //   switch (process.platform) {
  //     case 'win32':
  //       fileName = 'windows-x64'
  //       break
  //     case 'darwin':
  //       fileName = ['arm', 'arm64'].includes(process.arch) ? 'osx-arm64' : 'osx-x64'
  //       break
  //     case 'linux':
  //       fileName = ['arm', 'arm64'].includes(process.arch) ? 'linux-arm64' : 'linux-x64'
  //     default:
  //       throw new Error('対応していないOSです')
  //       break
  //   }
  //
  //   const { data } = await axios.get(`${this.apiRepository}/voicevox_core/releases`)
  //   const latestVersion = data.filter(v => !v.draft && !v.prerelease)[0]
  //   const downloadUrl = latestVersion.assets
  //     .find(asset => RegExp(`${fileName}-cpu-.+\.zip`).test(asset.browser_download_url))
  //   if (downloadUrl) {
  //     await download(downloadUrl, app.getPath('temp'))
  //   }
  // }
}
