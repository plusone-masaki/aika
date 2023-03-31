import axios from 'axios'

export default class VoiceRepository {
  private readonly baseUrl = 'http://127.0.0.1:50021'
  public async getSpeechVoice (text: string, speaker: number) {
    const query = await this.getQuery(text, speaker)
    return this.generateVoice(query, speaker)
  }

  public async getQuery (text: string, speaker: number) {
    const res = await axios.post(`${this.baseUrl}/audio_query?text=${text}&speaker=${speaker}`)
    return res.data
  }

  public async generateVoice (query: string, speaker: number) {
    const res = await axios.post(`${this.baseUrl}/synthesis?speaker=${speaker}`, query, { responseType : 'arraybuffer' })
    return new Blob([res.data], { type: 'audio/wav' })
  }
}
