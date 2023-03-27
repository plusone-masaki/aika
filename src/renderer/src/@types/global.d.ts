import { ViewType } from '@common/@types/view'
import view from '@common/view'
import model from '@common/model'
import log from '@common/log'

declare global {
  interface Window {
    page: ViewType
    api: {
      getModelList: () => Promise<string[]>
      getModelData: (name: string, filepath: string) => Promise<Blob>
      showInput: () => void
    }
    view: typeof view
    model: typeof model
    log: typeof log
  }
}
