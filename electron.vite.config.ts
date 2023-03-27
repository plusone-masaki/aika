import { resolve } from 'path'
import { bytecodePlugin, externalizeDepsPlugin, UserConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const config: UserConfig = {
  main: {
    plugins: [
      externalizeDepsPlugin(),
      // bytecodePlugin({
      //   transformArrowFunctions: false,
      // }),
    ],
    resolve: {
      alias: {
        '@common': resolve('src/common'),
        '@main': resolve('src/main'),
        '@renderer': resolve('src/renderer/src'),
      },
    },
  },
  preload: {
    plugins: [
      externalizeDepsPlugin(),
    ],
    resolve: {
      alias: {
        '@common': resolve('src/common'),
      },
    },
  },
  renderer: {
    plugins: [
      vue(),
      externalizeDepsPlugin(),
      bytecodePlugin({
        transformArrowFunctions: false,
      }),
    ],
    resolve: {
      alias: {
        '@common': resolve('src/common'),
        '@renderer': resolve('src/renderer/src'),
        '@framework': resolve('src/renderer/cubism-framework/src'),
      },
    },
    build: {
      modulePreload: {
        polyfill: true,
      },
    },
    publicDir: 'public',
  },
}

export default config
