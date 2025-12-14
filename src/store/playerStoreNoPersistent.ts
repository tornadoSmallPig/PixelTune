import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Song {
    id: string;      // 唯一标识
    name: string;
    url: string;     // Blob URL
    duration: number;
}

export const usePlayerStore = defineStore('player', () => {
    // --- State (数据) ---
    const playlist = ref<Song[]>([]);        // 播放列表
    const currentIndex = ref(-1);            // 当前播放索引
    const isPlaying = ref(false);            // 播放状态
    const currentTime = ref(0);              // 当前播放时间
    const duration = ref(0);                 // 当前歌曲总时长

    // 音频核心对象 (不直接暴露给 UI)
    const audio = new Audio();

    // --- Getters (计算属性) ---
    const currentSong = computed(() => {
        if (currentIndex.value === -1 || !playlist.value.length) return null;
        return playlist.value[currentIndex.value];
    });

    // --- Actions (行为/逻辑) ---

    // 1. 初始化监听器
    const initAudio = () => {
        audio.addEventListener('timeupdate', () => {
            currentTime.value = audio.currentTime;
        });
        audio.addEventListener('loadedmetadata', () => {
            duration.value = audio.duration;
        });
        audio.addEventListener('ended', () => {
            nextSong(); // 自动下一曲
        });
    };

    // 2. 添加歌曲
    const addFiles = (files: FileList) => {
        Array.from(files).forEach(file => {
            // 生成唯一ID
            const song: Song = {
                id: crypto.randomUUID(),
                name: file.name,
                url: URL.createObjectURL(file),
                duration: 0
            };
            playlist.value.push(song);
        });

        const firstSong = playlist.value[0];
        if (currentIndex.value === -1 && firstSong) {
            currentIndex.value = 0;
            loadSong(firstSong);
        }
    };

    // 3. 核心播放逻辑
    const loadSong = (song: Song) => {
        audio.src = song.url;
        audio.load();
    };

    const playIndex = (index: number) => {
        if (index < 0 || index >= playlist.value.length) return;
        const song = playlist.value[index];
        if (!song) return;
        currentIndex.value = index;
        loadSong(song);
        togglePlay(true);
    };

const togglePlay = (forceState?: boolean) => {
    // 若没有当前歌曲，则不执行任何操作
    if (!currentSong.value) return;

    const shouldPlay = forceState ?? !isPlaying.value;

    if (shouldPlay) {
        audio.play().catch(e => console.error("Play error:", e));
        isPlaying.value = true;
    } else {
        audio.pause();
        isPlaying.value = false;
    }
};

    const nextSong = () => {
        if (playlist.value.length === 0) return;
        let next = currentIndex.value + 1;
        if (next >= playlist.value.length) next = 0; // 循环播放
        playIndex(next);
    };

    const seek = (time: number) => {
        audio.currentTime = time;
        currentTime.value = time;
    };

    // 在 Store 创建时立即初始化监听
    initAudio();

    return {
        playlist,
        currentSong,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        addFiles,
        playIndex,
        togglePlay,
        nextSong,
        seek
    };
});