import { contextBridge, ipcRenderer } from 'electron'
import view from '@common/view'
import model from '@common/model'
import log from '@common/log'
import system from '@common/system'
import api from '@common/api'

const additionalArguments = (process.argv || []).slice(-1)
const ARGS_PAGE = 0

contextBridge.exposeInMainWorld('page', additionalArguments[ARGS_PAGE])
contextBridge.exposeInMainWorld('view', view)
contextBridge.exposeInMainWorld('model', model)
contextBridge.exposeInMainWorld('log', log)
contextBridge.exposeInMainWorld('system', {
  clickThrough: (enable: boolean) => ipcRenderer.send(system.CLICK_THROUGH, enable),
})
contextBridge.exposeInMainWorld('api', {
  getModelList: () => ipcRenderer.invoke(api.GET_MODEL_LIST),
  getModelData: (name: string, filepath: string) => ipcRenderer.invoke(api.GET_MODEL_DATA, name, filepath),
  sendMessage: (message: string) => ipcRenderer.invoke(api.SEND_MESSAGE, message),
  readMessage: (message: string) => ipcRenderer.invoke(api.READ_MESSAGE, message),
})
