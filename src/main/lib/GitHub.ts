import axios from 'axios'

type FindReleaseOptions = {
  draft?: boolean
  prerelease?: boolean
}

export default abstract class GitHub {
  protected readonly apiUrl: string = ''

  protected async getLatestRelease (repositoryName: string, options: FindReleaseOptions = {}) {
    const { data } = await axios.get(`${this.apiUrl}/${repositoryName}/releases`)
    return data.filter(v => (options.draft || !v.draft) && (options.prerelease || !v.prerelease)).shift()
  }
}
