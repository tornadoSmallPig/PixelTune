import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 使用相对路径，这样怎么移动 dist 文件夹都能读取到资源
  plugins: [vue()]
})