<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// --- 1. 定义状态 (相当于 Vue2 的 data) ---
const isPlaying = ref(false);          // 是否正在播放
const duration = ref(0);               // 歌曲总时长(秒)
const currentTime = ref(0);            // 当前播放时间(秒)
const songName = ref('请选择一首歌曲'); // 当前歌曲名

// 定义 audio 对象 (不放在 template 里，纯逻辑控制更灵活)
const audio = new Audio();

// --- 2. 定义方法 (相当于 Vue2 的 methods) ---

const formatTime = (seconds: number): string => {
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 处理文件上传
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length > 0) {
    const file = files[0];
    if (file) {  // 增加判断，确保 file 存在
      songName.value = file.name;
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.play();
      isPlaying.value = true;
    }
  }
};

// 播放/暂停切换
const togglePlay = () => {
  if (!audio.src) return; // 如果没选歌，啥都不做

  if (isPlaying.value) {
    audio.pause();
  } else {
    audio.play();
  }
  isPlaying.value = !isPlaying.value;
};

// 拖动进度条
const onSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = Number(target.value);
  
  // 更新音频时间
  audio.currentTime = val;
  currentTime.value = val;
};

// --- 3. 生命周期与监听 (相当于 Vue2 mounted/destroyed) ---

// 更新进度条的辅助函数
const updateProgress = () => {
  currentTime.value = audio.currentTime;
};

// 更新总时长的辅助函数
const updateDuration = () => {
  duration.value = audio.duration;
};

// 播放结束时重置
const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

onMounted(() => {
  // 绑定原生 Audio 事件
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateDuration);
  audio.addEventListener('ended', onEnded);
});

onUnmounted(() => {
  // 组件销毁时移除监听，防止内存泄漏
  audio.removeEventListener('timeupdate', updateProgress);
  audio.removeEventListener('loadedmetadata', updateDuration);
  audio.removeEventListener('ended', onEnded);
});
</script>

<template>
  <div class="player-container">
    <h1 class="pixel-title">Pixel Player Demo</h1>

    <div class="control-group">
      <label class="pixel-btn file-btn">
        导入本地音乐
        <input type="file" accept="audio/*" @change="handleFileChange" hidden />
      </label>
    </div>

    <div class="song-info">
      正在播放: {{ songName }}
    </div>

    <div class="progress-bar">
      <span>{{ formatTime(currentTime) }}</span>
      <input 
        type="range" 
        min="0" 
        :max="duration" 
        :value="currentTime" 
        @input="onSliderChange"
        step="0.1"
      />
      <span>{{ formatTime(duration) }}</span>
    </div>

    <button class="pixel-btn play-btn" @click="togglePlay" :disabled="!duration">
      {{ isPlaying ? '暂停 (||)' : '播放 (▶)' }}
    </button>
  </div>
</template>

<style scoped>
/* 简单的像素风样式模拟 */
.player-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  border: 4px solid #333;
  box-shadow: 8px 8px 0 #333; /* 像素阴影核心 */
  background-color: #f0f0f0;
  font-family: 'Courier New', Courier, monospace; /* 复古字体 */
  text-align: center;
}

.pixel-title {
  margin-bottom: 30px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.song-info {
  margin: 20px 0;
  font-weight: bold;
  min-height: 24px;
}

.pixel-btn {
  display: inline-block;
  padding: 10px 20px;
  border: 2px solid #333;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-weight: bold;
  box-shadow: 4px 4px 0 #333;
  transition: transform 0.1s;
  margin: 5px;
}

.pixel-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #333;
}

.file-btn {
  background-color: #4a90e2;
  color: white;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

input[type=range] {
  flex: 1;
  accent-color: #333; /* 浏览器自带的颜色设置 */
  height: 10px;
  cursor: pointer;
}
</style>