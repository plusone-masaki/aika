import { ChildProcess, execFile } from 'child_process'
import { createWriteStream, existsSync, mkdirSync, rmSync, readdirSync, renameSync } from 'fs'
import { basename, join } from 'path'
import { https } from 'follow-redirects'
import zipBin from '7zip-bin'
import { extractFull as extractZip, SevenZipOptions } from 'node-7z'
import { app } from 'electron'
import GitHub from '../lib/GitHub'

export default class VoiceVox extends GitHub {
  protected readonly apiUrl = 'https://api.github.com/repos/VOICEVOX'
  private readonly resourcePath = join(app.getPath('userData'), 'resources', 'voicevox')
  private process?: ChildProcess

  public async initialize () {
    // エンジンの存在確認
    if (!existsSync(join(this.resourcePath, 'run.exe'))) {
      await this.install()
    }
  }

  public up () {
    this.process = execFile(join(this.resourcePath, 'run.exe'))
  }

  public down () {
    if (this.process?.pid) {
      console.info('VOICEVOX server closing...', this.process.kill(0))
    }
  }

  private async install () {
    let os = ''
    switch (process.platform) {
      case 'win32':
        os = 'windows-cpu'
        break
      case 'darwin':
        os = 'osx'
        break
      case 'linux':
        os = 'linux-cpu'
        break
      default:
        throw new Error('対応していないOSです')
    }

    const latestRelease = await this.getLatestRelease('voicevox_engine')
    const downloadUrls = latestRelease
      .assets
      .filter(asset => RegExp(`${os}-.+\.7z\.[0-9]{3}$`).test(asset.browser_download_url))
      .map(asset => asset.browser_download_url)

    // ダウンロード処理の開始
    const downloads: Promise<void>[] = []
    let contentLength: number = 0
    let fetchedLength: number = 0
    console.log('[Download list]')
    console.log(downloadUrls.join('\n'))

    // 一時ディレクトリの初期化
    const tempDir = join(app.getPath('temp'), app.getName())
    rmSync(tempDir, { recursive: true, force: true })
    mkdirSync(tempDir, { recursive: true })
    for (let i = 0; i < downloadUrls.length; i++) {
      const downloadUrl = downloadUrls[i]

      downloads.push(new Promise((resolve, reject) => {
        https.get(downloadUrl, (res) => {
          // 合計データサイズを更新
          contentLength += Number(res.headers['content-length'])

          // ファイルに書き込み
          res.pipe(createWriteStream(join(tempDir, basename(downloadUrl))))
          // 取得済みデータサイズの更新
          res.on('data', (chunk) => {
              fetchedLength += chunk.length
              console.log(`downloading... ${fetchedLength}/${contentLength}`)
            })
            .on('close', resolve)
            .on('error', reject)
        })
      }))
    }
    await Promise.all(downloads)

    // 圧縮データの解凍
    const extractDir = join(app.getPath('temp'), 'aika-extracted')
    console.log(`extract ${tempDir} ${extractDir}`)
    await new Promise((resolve, reject) => {
      const unzipOption: SevenZipOptions = {
        yes: true,
        $bin: zipBin.path7za,
      }
      const zipStream = extractZip(tempDir, extractDir, unzipOption)
      zipStream
        .on('progress', ({ percent }) => console.log(`extracting... ${percent}%`))
        .on('end', resolve)
        .on('error', reject)
    })
    const extracted = join(extractDir, readdirSync(extractDir)[0])
    console.log('extract completed!', extracted)

    rmSync(this.resourcePath, { recursive: true, force: true })
    renameSync(extracted, this.resourcePath)
    console.log('install completed!', extracted, this.resourcePath)
  }
}
