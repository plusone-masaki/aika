import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'

type ChatModel = 'gpt-4'
  | 'gpt-4-0314'
  | 'gpt-4-32k'
  | 'gpt-4-32k-0314'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-0301'
  | 'text-davinci-003'
  | 'text-davinci-002'
  | 'code-davinci-002'

export default class AI {
  private readonly configuration: Configuration
  private readonly api: OpenAIApi
  private readonly chatModel: ChatModel = 'gpt-3.5-turbo'

  private name: string = 'はる'
  private age: number = 24
  private gender: '男性'|'女性' = '女性'
  private tone: string = '丁寧語'

  private chatHistory: ChatCompletionRequestMessage[] = [
    { role: 'user', content: this.profile },
    { role: 'assistant', content: 'はい、わかりました' },
  ]

  private get profile () {
    return '下記の人物になりきってください。'
      + `名前: ${this.name}\n`
      + `年齢: ${this.age}\n`
      + `性別: ${this.gender}\n`
      + `口調: ${this.tone}\n`
  }

  public constructor () {
    this.configuration = new Configuration({
      apiKey: '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',
    })
    this.api = new OpenAIApi(this.configuration)
  }

  public async sendMessage (content: string) {
    console.log('sendQuestion', content)
    if (!content) return
    const question: ChatCompletionRequestMessage = { role: 'user', content }
    const response = await this.api.createChatCompletion({
      model: this.chatModel,
      messages: [
        ...this.chatHistory,
        question,
      ],
    })
    this.chatHistory.push(question)

    const responseMessages: ChatCompletionRequestMessage[] = response
      .data
      .choices
      .map(choice => choice.message!)
      .filter(m => m)
    this.chatHistory.concat(responseMessages)

    return responseMessages.map(message => message.content).join('\n\n')
  }
}
