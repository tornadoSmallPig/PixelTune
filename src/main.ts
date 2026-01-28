import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// pinia
import { createPinia } from 'pinia'

// pixel ui
import Pixelium from '@pixelium/web-vue'
import '@pixelium/web-vue/dist/pixelium-vue.css'
import '@pixelium/web-vue/dist/font.css'// Import the font

// 测试框架（开发环境）
import { initializeTestFramework } from './tests/index'

// 初始化测试框架（开发环境自动初始化）
if (import.meta.env.DEV) {
  initializeTestFramework()
}

createApp(App)
    .use(createPinia())
    .use(Pixelium)
    .mount('#app')
