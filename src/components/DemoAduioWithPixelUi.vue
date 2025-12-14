<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// --- 状态逻辑 (保持不变) ---
const isPlaying = ref(false);
const duration = ref(0);
const currentTime = ref(0);
const songName = ref(''); // 默认为空
const audio = new Audio();

// --- 方法逻辑 ---
const formatTime = (time: number) => {
    if (!time) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- 关键修改 1: 定义 input 的引用 ---
const fileInputRef = ref<HTMLInputElement | null>(null);
const triggerFileSelect = () => {
    fileInputRef.value?.click();
}
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0){
        console.log('No file selected')
        return;
    }

    const file = files[0];

    if (!file) {
        console.log('file is null')
        return;
    }

    songName.value = file.name;
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.play();
    isPlaying.value = true;
};

const togglePlay = () => {
    if (!audio.src) return;
    if (isPlaying.value) audio.pause();
    else audio.play();
    isPlaying.value = !isPlaying.value;
};

const onSliderChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    audio.currentTime = Number(target.value);
    currentTime.value = Number(target.value);
};

// --- 生命周期 ---
const updateProgress = () => { currentTime.value = audio.currentTime; };
const updateDuration = () => { duration.value = audio.duration; };
const onEnded = () => { isPlaying.value = false; currentTime.value = 0; };

onMounted(() => {
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
});

onUnmounted(() => {
    audio.removeEventListener('timeupdate', updateProgress);
    audio.removeEventListener('loadedmetadata', updateDuration);
    audio.removeEventListener('ended', onEnded);
});
</script>

<template>
    <div class="pixel-card">
        <h2 class="title">PixelTune</h2>

        <div class="section">
            <PxButton theme="primary" @click="triggerFileSelect">
                📂 OPEN MP3
            </PxButton>
            <input 
                ref="fileInputRef"
                type="file" 
                accept="audio/*" 
                @change="handleFileChange" 
                style="display: none;" 
            />
        </div>

        <div class="lcd-screen">
            <p class="scrolling-text">{{ songName || 'NO DISK INSERTED' }}</p>
        </div>

        <div class="controls">
            <span class="time">{{ formatTime(currentTime) }}</span>
            <input class="pixel-range" type="range" min="0" :max="duration" :value="currentTime" @input="onSliderChange"
                step="0.1" />
            <span class="time">{{ formatTime(duration) }}</span>
        </div>

        <div class="actions">
            <PxButton @click="togglePlay" :disabled="!duration">
                {{ isPlaying ? 'PAUSE' : 'PLAY' }}
            </PxButton>
        </div>
    </div>
</template>

<style scoped>
.pixel-card {
    border: 4px solid #333;
    padding: 20px;
    background: #f0f0f0;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.title {
    margin-top: 0;
    font-family: 'Courier New', monospace;
    /* 可以在 main.ts 引入像素字体后删除这行 */
}

.section {
    margin-bottom: 15px;
}

/* 模拟复古液晶屏 */
.lcd-screen {
    background: #9ea792;
    border: 4px inset #666;
    padding: 10px;
    margin: 15px 0;
    font-family: monospace;
    color: #333;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    font-family: monospace;
}

.pixel-range {
    flex: 1;
    height: 10px;
    -webkit-appearance: none;
    appearance: none;
    /* 添加标准属性 */
    background: #333;
    outline: none;
}

.pixel-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    /* 同样添加标准属性以增强兼容性 */
    width: 15px;
    height: 20px;
    background: #fff;
    border: 2px solid #000;
    cursor: pointer;
}
</style>