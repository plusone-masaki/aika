import { ViewType } from '@common/@types/view'
import view from '@common/view'
import model from '@common/model'
import log from '@common/log'

declare global {
  interface Window {
    page: ViewType
    system: {
      alwaysOnTop: () => void
      clickThrough: (enable: boolean) => void
    }
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

declare module 'marked' {
  const types = import('marked/lib/marked.esm.js')
  export = types
}

declare module 'isomorphic-dompurify' {
  const types = import('isomorphic-dompurify')
  export = types
}
