<script setup lang="ts">
import { usePlayerStore } from '../store/playerStore.ts';
import { ref } from 'vue';

import { IconFolder, IconMusicSolid, IconFileImport } from '@pixelium/web-vue/icon-hn/es'
import { IconRemoveBox } from '@pixelium/web-vue/icon-pa/es'

// store
const store = usePlayerStore();
const fileInputRef = ref<HTMLInputElement | null>(null);
const folderInputRef = ref<HTMLInputElement | null>(null);

// 歌词上传相关的 ref
const lrcInputRef = ref<HTMLInputElement | null>(null);
const targetSongIndex = ref(-1); // 记录当前正在给哪首歌传歌词

const triggerLrcUpload = (index: number) => {
  targetSongIndex.value = index;
  // 清空 value，否则选同一个文件不会触发 change 事件
  if (lrcInputRef.value) lrcInputRef.value.value = '';
  lrcInputRef.value?.click();
};

// --- 新增：处理歌词文件读取 ---
const handleLrcSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    if (!file) {
      console.log('文件为空');
      return;
    }

    // 简单的后缀检查
    if (!file.name.endsWith('.lrc')) {
      alert('请选择 .lrc 格式的歌词文件');
      return;
    }

    try {
      // 读取文件内容为文本
      const text = await file.text();

      // 调用 store 更新
      if (targetSongIndex.value !== -1) {
        await store.updateLyric(targetSongIndex.value, text);
        // 可选：提示成功
        // 增强类型安全性并消除TS报错
        const song = store.playlist[targetSongIndex.value];
        if (song) {
          console.log(`歌词已更新: ${song.name}`);
        } else {
          console.warn('无效的歌曲索引，无法显示名称');
        }
      }
    } catch (err) {
      console.error('歌词读取失败', err);
    }
  }
};

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
      <input ref="lrcInputRef" type="file" accept=".lrc" hidden @change="handleLrcSelect">
    </div>

    <div class="list-container">
      <div v-for="(song, index) in store.playlist" :key="song.id" class="list-item"
        :class="{ active: index === store.currentIndex }" @click="store.playIndex(index)">
        <span class="icon">{{ getDisplayIndex(index) }}. </span>
        <span class="name">{{ song.name }}</span>
        <div class="action-btns">
          <PxButton class="icon-btn lrc-btn" size="small" theme="primary" :title="song.lyric ? '替换歌词' : '添加歌词'"
            @click.stop="triggerLrcUpload(index)">
            <IconFileImport :size="16" :style="{ opacity: song.lyric ? 1 : 0.4 }" />
          </PxButton>
          <PxButton class="icon-btn delete-btn" size="small" theme="danger" @click.stop="store.removeSong(index)">
            <IconRemoveBox :size="16" />
          </PxButton>
        </div>
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
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

/* 列表容器自适应 */
.list-container {
  flex: 6;
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

.action-btns {
  display: flex;
  gap: 4px;
  /* 确保按钮不被挤压 */
  flex-shrink: 0;
  /* 默认隐藏，悬停显示 */
  opacity: 0;
  transition: opacity 0.2s;
}

.list-item:hover .action-btns {
  opacity: 1;
}

.delete-btn {
  margin-left: auto;
}

/* 歌词按钮微调 */
.lrc-btn {
  color: #333; 
}
</style>