# 🎵 Pixel Tune
Pixel Tune 是一个基于 Vue 3 + Vite 构建的复古像素风 Web 音乐播放器。它结合了怀旧的 8-bit 视觉风格与现代 Web 技术，支持本地音乐导入、文件夹批量添加，并利用 IndexedDB 实现数据的持久化存储，刷新页面后依然能保留你的歌单。

![运行截图](/markdownImage/testRunTimeImage.png)
<img src="/markdownImage/runtimeImage2.png" alt="Example Image" width="300" height="600" style="display: block; margin-left: auto; margin-right: auto;">

## 👨‍💻 todo
1. 添加歌词显示(部分完成,待优化)
2. 播放列表排序
3. 爬虫与导入歌曲
4. 集成AI大模型解析歌曲生成歌词文件

## ✨ 目前功能特性 (Features)
- 🎨 像素风 UI: 基于 @pixelium/web-vue 组件库构建，配合自定义的像素滚动条和边框，还原复古掌机体验。
- 📂 本地文件播放: 支持 MP3, FLAC, WAV, OGG, M4A, AAC 等主流音频格式。
- 💾 持久化存储: 使用 IndexedDB (LocalForage) 存储大型音频文件 Blob，刷新页面不丢失歌单，且不需要上传文件到服务器，保护隐私。
- 📁 批量导入: 支持拖拽或点击按钮导入单个文件，也支持导入整个文件夹（递归过滤音频文件）。
- 📱 响应式布局:
    - 桌面端: 左侧列表 + 右侧播放器，支持侧边栏折叠。
    - 移动端: 抽屉式侧边栏设计，更好的触屏体验。
- 🎵 歌词显示: 支持 LRC 格式歌词文件，点击歌词可跳转播放进度，歌词与播放器状态实时同步。
- 🧪 测试框架: 完整的零耦合测试系统，支持模块化测试、可视化测试面板、浏览器控制台控制。
- ⚡ 性能优化: 针对大型二进制文件对象采用了非响应式缓存策略，避免 Vue Proxy 带来的性能开销。
- 🔄 智能逻辑: 自动去重（避免重复添加同名歌曲）、自动播放下一曲、删除歌曲后智能索引修正。
- 🛠️ 技术栈 (Tech Stack)
   - 核心框架: Vue 3 (Script Setup + TypeScript)
   - 构建工具: Vite
   - 状态管理: Pinia
   - 持久化存储: LocalForage (IndexedDB Wrapper)
   - UI 组件库: @pixelium/web-vue
   - 图标库: @pixelarticons/vue

## 🚀 快速开始 (Getting Started)
1. 安装依赖
```bash
npm install
```
2. 启动开发服务器
```bash
npm run dev
```
3. 构建生产版本
```Bash
npm run build
```
📂 项目结构
Plaintext
```
src/
├── assets/             # 静态资源 (Logo 等)
├── components/         # 组件
│   ├── PixelPlayer.vue   # 播放器控制面板 (右侧/主区域)
│   ├── PixelPlaylist.vue # 播放列表与文件管理 (左侧/侧边栏)
│   ├── PixelLyrics.vue   # 歌词显示组件
│   └── ...
├── store/              # Pinia 状态管理
│   ├── playerStore.ts    # 核心逻辑：播放控制、文件存取、IndexedDB交互
│   └── lyricStore.ts     # 歌词状态管理
├── tests/              # 测试框架
│   ├── components/       # 测试组件
│       └── TestFramework.vue # 测试框架组件 (开发环境)
│   ├── stores/          # 测试模块
│   ├── utils/           # 测试工具
│   ├── types/           # 测试类型定义
│   └── index.ts         # 测试框架入口
├── utils/              # 工具函数
│   └── lrcParser.ts     # LRC歌词文件解析器
├── App.vue             # 根组件 (负责响应式布局与侧边栏逻辑)
├── main.ts             # 入口文件 (引入 UI 库与全局样式)
└── style.css           # 全局样式重置与字体变量
```
## 💡 核心实现点
1. 突破 LocalStorage 限制
由于 LocalStorage 只有 5MB 容量且仅支持字符串，本项目使用了 localforage 操作 IndexedDB 来存储音频文件的二进制数据（Blob）。

2. Vue 响应式性能优化
为了避免 Vue 将巨大的 File 或 Blob 对象转为响应式对象（会导致严重的内存消耗和卡顿），采用了 "逃生舱" 模式：
    - State : Pinia 中只存储轻量级的元数据（ID、歌名、Blob URL）。
    - Cache : 真实的文件对象存储在 window._fileCache 或非响应式的 Map 中，仅在保存/读取数据库时调用。

3. 歌词模块解耦设计
歌词功能采用独立的 Store 设计，通过 Pinia 的响应式系统与播放器状态实时同步，支持点击歌词跳转播放进度，实现了歌词与播放器的完全解耦。

4. 零耦合测试框架
开发了完整的测试系统，特点包括：
   - 环境变量控制，开发环境自动启用，生产环境自动禁用
   - 可视化测试面板，支持模块化测试和结果统计
   - 全局控制台控制，支持浏览器端测试调用
   - 插件式架构，易于扩展新的测试模块


## 📄 License
```
This project is licensed under the AGPL-3.0 License. You are free to use, modify, and distribute the software, but if you make any changes and deploy the software (even over a network), you must make the modified source code available to users under the same license.
```

**由 tornadoSmallPig 开发与维护**