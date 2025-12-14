<script setup lang="ts">
import { useLyricStore } from '../store/lyricStore';
import { ref, watch, nextTick } from 'vue';

const lyricStore = useLyricStore();
// 注意：这里引用的是 scroll container (即 class="screen" 的那个 div)
const containerRef = ref<HTMLElement | null>(null);

// 监听当前行变化，实现自动滚动
watch(() => lyricStore.currentLineIndex, async (newIndex) => {
    if (newIndex >= 0 && containerRef.value) {
        await nextTick();

        // 获取高亮的那一行元素
        const activeEl = containerRef.value.querySelector('.active-line') as HTMLElement;

        if (activeEl) {
            // --- 核心修改：使用 scrollTop 计算，彻底解决页面跳动问题 ---

            // 1. 获取容器的高度
            const containerHeight = containerRef.value.clientHeight;
            // 2. 获取当前行的高度
            const lineHeight = activeEl.clientHeight;
            // 3. 获取当前行距离列表顶部的距离
            const offsetTop = activeEl.offsetTop;

            // 4. 计算目标滚动位置：让当前行处于容器中间
            // 公式：元素顶部位置 - 容器一半高度 + 元素一半高度
            const targetScrollTop = offsetTop - containerHeight / 2 + lineHeight / 2;

            // 5. 执行平滑滚动
            containerRef.value.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }
});
</script>

<template>
    <div class="lyrics-card">
        <div class="screen" ref="containerRef">
            <div v-if="lyricStore.noLyric" class="empty-tip">
                NO LYRICS FOUND
            </div>

            <div v-else-if="lyricStore.lines.length === 0" class="empty-tip">
                WAITING FOR AUDIO...
            </div>

            <ul v-else class="lrc-list">
                <li v-for="(line, index) in lyricStore.lines" :key="index" class="lrc-line"
                    :class="{ 'active-line': index === lyricStore.currentLineIndex }"
                    @click="lyricStore.seekToLine(index)">
                    {{ line.text }}
                </li>
            </ul>

        </div>
    </div>
</template>

<style scoped>
.lyrics-card {
    width: 100%;
    height: 100%;
    background: #222;
    /* 歌词背景深色一点，像卡拉OK */
    border: 4px solid #000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.screen {
    position: relative;
    flex: 1;
    overflow-y: auto;
    /* 允许手动滚动查看 */
    padding: 50% 0;
    /* 上下留白，保证第一句和最后一句也能居中 */
    scroll-behavior: smooth;

    /* 隐藏滚动条 (可选，为了美观) */
    scrollbar-width: none;
}

.screen::-webkit-scrollbar {
    display: none;
}

.lrc-list {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: center;
}

.lrc-line {
    padding: 12px 10px;
    color: #666;
    font-family: 'Fusion Pixel Zh_hans', monospace;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
}

.lrc-line:hover {
    color: #999;
    background: rgba(255, 255, 255, 0.05);
}

/* 高亮样式 */
.active-line {
    color: #4eb8a4;
    /* 像素风主题色 */
    font-size: 16px;
    font-weight: bold;
    text-shadow: 2px 2px 0px #000;
    transform: scale(1.05);
}

.empty-tip {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-family: monospace;
}
</style>