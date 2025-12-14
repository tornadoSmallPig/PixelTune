<script setup lang="ts">
import { usePlayerStore } from '../store/playerStore.ts';
import { ref } from 'vue';

import { IconFolder, IconMusicSolid } from '@pixelium/web-vue/icon-hn/es'
import { IconRemoveBox } from '@pixelium/web-vue/icon-pa/es'

// 拿到 store
const store = usePlayerStore();
const fileInputRef = ref<HTMLInputElement | null>(null);
const folderInputRef = ref<HTMLInputElement | null>(null);

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    store.addFiles(input.files);
  }
};

// 用于简化模板中的显示逻辑
const getDisplayIndex = (index: number) => {
  return index === store.currentIndex && store.isPlaying ? '▶' : (index + 1);
};
</script>

<template>
  <div class="playlist-card">
    <div class="header">
      <h3 class="pixel-font">PLAYLIST [{{ store.playlist.length }}]</h3>
      <div class="btn-group">
        <PxButton size="small" theme="primary" @click="fileInputRef?.click()">
          <IconMusicSolid :size="16"></IconMusicSolid>
        </PxButton>
        <PxButton size="small" theme="primary" @click="folderInputRef?.click()">
          <IconFolder :size="16"></IconFolder>
        </PxButton>
      </div>
      <input ref="fileInputRef" type="file" multiple accept="audio/*" hidden @change="handleFileSelect">
      <input ref="folderInputRef" type="file" webkitdirectory directory hidden @change="handleFileSelect">
    </div>

    <div class="list-container">
      <div v-for="(song, index) in store.playlist" :key="song.id" class="list-item"
        :class="{ active: index === store.currentIndex }" @click="store.playIndex(index)">
        <span class="icon">{{ getDisplayIndex(index) }}. </span>
        <span class="name">{{ song.name }}</span>
        <PxButton class="delete-btn" size="small" theme="danger" @click.stop="store.removeSong(index)">
          <IconRemoveBox size="16"></IconRemoveBox>
        </PxButton>
      </div>

      <div v-if="store.playlist.length === 0" class="empty-tip">
        DROP FILES HERE
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-card {
  width: 100%;
  height: 100%;
  /* 强制继承 aside 的高度 */
  display: flex;
  /* 开启 flex 布局 */
  flex-direction: column;
  /* 垂直排列：上Header，下List */
  border: none;
  /* 建议去掉边框，因为 aside 已经有边框了 */
  background: #e0e0e0;
  overflow: hidden;
  /* 关键：防止卡片自身溢出 */
}

.header {
  flex-shrink: 0;
  height: 7%;
  /* 防止被挤压 */
  background: #333;
  color: #fff;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

/* 列表容器自适应 */
.list-container {
  flex: 1;
  /* 占据剩余高度 */
  overflow-y: auto;
  /* 列表过长时滚动 */
  padding: 10px;
}

.list-item {
  display: flex;
  padding: 8px;
  border-bottom: 2px dashed #ddd;
  cursor: pointer;

}

.list-item:hover {
  background-color: #f0f0f0;
}

.list-item.active {
  background-color: #e0e0e0;
  font-weight: bold;
  color: #4a90e2;
}

.icon {
  width: 30px;
  /* --- 修改：改为右对齐，视觉更整齐 --- */
  text-align: left;
  /* --- 新增：给数字和歌名之间留个固定的呼吸空间 --- */
  padding-right: 8px;
}

.name {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  margin-left: auto;
}
</style>