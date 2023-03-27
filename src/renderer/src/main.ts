import { createApp } from 'vue'
import * as VueRouter from 'vue-router'
import routes from '@renderer/routes'
import App from '@renderer/App.vue'
import '@renderer/assets/css/styles.sass'

const router = VueRouter.createRouter({
  history: VueRouter.createMemoryHistory(),
  routes,
})

createApp(App)
  .use(router)
  .mount('#app')
