import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './assets/styles/common.scss'
import { permission } from './directives/permission'
import { setRouter } from './utils/request'

// 设置路由实例
setRouter(router)

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.directive('permission', permission)

// 添加版本号到 window 对象
window.__APP_VERSION__ = Date.now()

app.mount('#app')
