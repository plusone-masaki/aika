import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
} from 'electron'

declare type ViewType = 'figure' | 'config'
declare interface ViewContext {
  options: BrowserWindowConstructorOptions
  hook?: (window: BrowserWindow) => void
}
