<script setup lang="ts">
import { ref } from 'vue';
import PixelPlayer from './components/PixelPlayer.vue';
import PixelPlaylist from './components/PixelPlayList.vue';

import { IconList } from '@pixelium/web-vue/icon-pa/es';

// 默认逻辑：如果屏幕宽 (>768)，默认展开；否则默认收起
const isSidebarOpen = ref(window.innerWidth > 768);

// 切换开关
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// 专门给手机端用的：点击遮罩层关闭
const closeSidebarMobile = () => {
  if (window.innerWidth <= 768) {
    isSidebarOpen.value = false;
  }
};

</script>

<template>
  <PxContainer class="app-container">

    <PxHeader height="60px" class="header-style">
      <button class="menu-btn" @click="toggleSidebar" title="切换列表显示">
        <IconList :size="24" />
      </button>

      <div class="logo-group">
        <img src="./assets/pageIcon.svg" alt="Pixelium" class="logo">
        <h1 class="logo-text">Pixel Tune</h1>
      </div>
    </PxHeader>

    <PxContainer class="content-container">

      <div class="mobile-overlay" v-if="isSidebarOpen" @click="closeSidebarMobile"></div>

      <PxAside class="aside-style" :class="{ 'collapsed': !isSidebarOpen }">
        <PixelPlaylist class="playlist-full-height" />
      </PxAside>

      <PxMain class="main-style">
        <PixelPlayer />
      </PxMain>

    </PxContainer>
  </PxContainer>
</template>

<style scoped>
/* 外层容器：占满视口，垂直排列 */
.app-container {
  width: 100vw;
  height: 100vh;
  padding: 8px;
  display: flex;
  /* 开启 Flex */
  flex-direction: column;
  /* 垂直排列：上Header，下Content */
  background-color: #f0f0f0;
  overflow: hidden;
  /* 杜绝任何外层滚动条 */
  box-sizing: border-box;
}

/* 创建一个覆盖全屏的边框层 */
.app-container::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  /* 保证在最上层 */
  pointer-events: none;
  /* 关键：让鼠标点击能穿透边框，点到里面的按钮 */

  /* 像素风边框样式 */
  border: 8px solid #333;
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.3);
  /* 半透明高光 */
}

/* 头部样式 */
.header-style {
  /* 为内部绝对定位的按钮提供锚点 */
  position: relative;
  background-color: #43c653;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  border-bottom: 4px solid #000;
  flex-shrink: 0;
  /* 防止头部被压缩 */
  z-index: 200;
}

/* 菜单按钮通用样式 */
.menu-btn {
  /* 绝对定位，脱离文档流 */
  position: absolute;
  /* 靠左距离，与 header padding 保持一致 */
  left: 20px;         
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  margin-right: 15px;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.menu-btn:active {
  transform: scale(0.9);
}

.logo-group {
  display: flex;
  align-items: center;
}

/* 记得删掉 margin-left: auto */
.logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  font-family: 'Fusion Pixel Zh_hans', monospace;
  font-size: 24px;
  letter-spacing: 2px;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

/* --- 侧边栏样式 (桌面端逻辑) --- */
.aside-style {
  background-color: #e0e0e0;
  border-right: 4px solid #333;
  height: 100%;
  overflow: hidden;
  /* 关键：折叠时隐藏内部内容 */

  /* 初始状态：展开 (宽度 300px) */
  width: 300px;
  min-width: 300px;
  /* 防止被 flex 压缩 */

  /* 动画过渡：平滑改变宽度 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 防止内部文字折行导致动画时布局崩坏 */
  white-space: nowrap;
}

/* 桌面端：收起状态 */
.aside-style.collapsed {
  width: 0 !important;
  /* 宽度变 0 */
  min-width: 0 !important;
  border-right: 0px solid #333;
  /* 边框也去掉，否则会留下一条黑线 */
  opacity: 0.5;
  /* 可选：加点淡出效果 */
}

/* --- 主区域样式 --- */
.main-style {
  flex: 1;
  /* 自动占据剩余空间 (侧边栏收起时会自动变宽) */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #888;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s;
  /* 它是跟着侧边栏一起动的，也可以加个过渡 */
}

.playlist-full-height {
  width: 100%;
  height: 100%;
}

/* ========================================= */
/* --- 手机端响应式覆盖 (Mobile Override) --- */
/* ========================================= */
@media (max-width: 768px) {

  /* 1. 遮罩层 */
  .mobile-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    backdrop-filter: blur(2px);
  }

  /* 2. 侧边栏变为“抽屉模式” */
  .aside-style {
    position: absolute;
    /* 脱离文档流，浮在上面 */
    top: 0;
    left: 0;
    height: 100%;
    z-index: 100;
    box-shadow: 4px 0 10px rgba(0, 0, 0, 0.5);

    /* 手机端逻辑：默认显示宽度，通过 transform 移出去 */
    width: 280px !important;
    min-width: 280px !important;
    border-right: 4px solid #333;
    /* 恢复边框 */

    /* 覆盖桌面端的 collapsed 逻辑 
       桌面端 collapsed 是 width: 0
       手机端 collapsed 是 translateX(-100%)
    */
    transform: translateX(0);
    /* 展开状态 */
  }

  .aside-style.collapsed {
    /* 手机端收起：移到屏幕外面 */
    transform: translateX(-100%);

    /* 此时宽度必须保持，不能是 0，否则滑出来也是空的 */
    width: 280px !important;
    border-right: 4px solid #333;
    opacity: 1;
  }
}
</style>