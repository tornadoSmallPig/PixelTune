import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// pinia
import { createPinia } from 'pinia'

// pixel ui
import Pixelium from '@pixelium/web-vue'
import '@pixelium/web-vue/dist/pixelium-vue.css'
import '@pixelium/web-vue/dist/font.css'// Import the font

createApp(App)
    .use(createPinia())
    .use(Pixelium)
    .mount('#app')
