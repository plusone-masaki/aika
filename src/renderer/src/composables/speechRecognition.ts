import { Ref } from 'vue'

export default class SpeechListener {
  private readonly recognition: SpeechRecognition | null = null
  public readonly enabled: boolean = false

  public constructor () {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()

      this.recognition.lang = navigator.language
      this.recognition.interimResults = true
      this.recognition.continuous = true
      this.enabled = true
    } else {
      this.enabled = false
    }
  }

  public start (keyword: Ref<string>, submit: () => void) {
    if (!this.recognition) throw new Error('SpeechRecognition unavailable.')

    this.recognition.onresult = (e) => {
      console.log('recognition Result!!', e)
      Array
        .from(e.results)
        .forEach(result => {
          keyword.value = result[0].transcript
          if (result.isFinal) submit()
        })
    }
    this.recognition.onend = (e) => console.log('recognition on end', e)
    this.recognition.onerror = (e) => console.log('recognition on error', e)
    this.recognition.start()
  }

  public stop () {
    if (!this.recognition) return

    this.recognition.stop()
    this.recognition.onresult = null
  }
}
