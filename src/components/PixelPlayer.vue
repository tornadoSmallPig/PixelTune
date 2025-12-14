<script setup lang="ts">
import { usePlayerStore } from '../store/playerStore.ts';

// 直接使用 store，无需 props
const store = usePlayerStore();

// 辅助函数：格式化时间
const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const handleSeek = (e: Event) => {
    const val = Number((e.target as HTMLInputElement).value);
    store.seek(val);
};
</script>

<template>
    <div class="player-card">
        <div class="screen">
            <p class="song-title">{{ store.currentSong?.name || 'WAITING...' }}</p>
            <div class="status">{{ store.isPlaying ? 'PLAYING >>' : 'PAUSED ||' }}</div>
        </div>

        <div class="progress-bar">
            <span>{{ formatTime(store.currentTime) }}</span>
            <input type="range" class="pixel-range" :min="0" :max="store.duration || 100" :value="store.currentTime"
                :disabled="!store.currentSong" @input="handleSeek">
            <span>{{ formatTime(store.duration) }}</span>
        </div>

        <div class="controls">
            <PxButton @click="store.togglePlay()">
                {{ store.isPlaying ? 'PAUSE' : 'PLAY' }}
            </PxButton>
            <PxButton @click="store.nextSong()">NEXT >|</PxButton>
        </div>
    </div>
</template>

<style scoped>
/* 这里沿用你之前的样式，稍微调整 */
.player-card {
    width: 400px;
    border: 4px solid #333;
    padding: 20px;
    background: #f0f0f0;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
}

.screen {
    background: #9ea792;
    padding: 10px;
    border: 4px inset #666;
    margin-bottom: 20px;
    text-align: center;
}

.song-title {
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.progress-bar {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 20px;
}

.pixel-range {
    flex: 1;
    height: 10px;
    -webkit-appearance: none;
    appearance: none;
    background: #333;
}

.pixel-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 15px;
    height: 20px;
    background: #fff;
    border: 2px solid #000;
}

.controls {
    display: flex;
    justify-content: center;
    gap: 10px;
}
</style>