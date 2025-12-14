import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { usePlayerStore } from './playerStore';
import { parseLrc, type LyricLine } from '../utils/lrcParser';

// 模拟一些歌词数据 (实际开发中这里应该去 fetch 网络接口或读取本地 lrc 文件)
// 在 Demo 阶段，我们可以先写死一个测试用
const MOCK_LRC = `
[00:00.00]Pixel Tune Demo
[00:02.00]Loading audio...
[00:05.00]这是一个歌词测试
[00:10.00]歌词模块与播放器解耦
[00:15.00]点击歌词可以跳转进度
[00:20.00]End
`;

export const useLyricStore = defineStore('lyric', () => {
    const playerStore = usePlayerStore();

    // State
    const lines = ref<LyricLine[]>([]);
    const currentLineIndex = ref(-1);
    const noLyric = ref(false);// 控制是否显示 "暂无歌词"

    // 修改监听逻辑
    watch(
        // 监听源：返回当前歌曲的 ID 和 lyric 内容的组合
        // 这样无论是切歌(ID变了)还是换歌词(lyric变了)，都能触发
        () => {
            const song = playerStore.currentSong;
            return song ? { id: song.id, lyric: song.lyric } : null;
        },
        (newVal) => {
            // 1. 重置状态
            lines.value = [];
            currentLineIndex.value = -1;
            noLyric.value = false;

            if (!newVal) return;

            // 2. 解析
            if (newVal.lyric && newVal.lyric.trim().length > 0) {
                lines.value = parseLrc(newVal.lyric);
                noLyric.value = false;
            } else {
                noLyric.value = true;
            }
        },
        { immediate: true }
    );

    // 监听当前歌曲变化
    watch(() => playerStore.currentSong, (newSong) => {
        // 1. 重置状态
        lines.value = [];
        currentLineIndex.value = -1;
        noLyric.value = false;

        if (!newSong) return;

        // 2. 判断是否有歌词
        if (newSong.lyric && newSong.lyric.trim().length > 0) {
            // 有歌词 -> 解析
            lines.value = parseLrc(newSong.lyric);
            noLyric.value = false;
        } else {
            // 无歌词 -> 标记状态
            noLyric.value = true;
        }
    }, { immediate: true }); // 立即执行一次，防止刷新后没歌词

    // Logic: 核心同步逻辑 (监听时间变化)
    watch(() => playerStore.currentTime, (time) => {
        if (lines.value.length === 0) return;

        // 找到当前时间应该显示的那一行
        // 算法：找到第一个 time > 当前时间的行，它的前一行就是当前行
        const index = lines.value.findIndex(line => line.time > time);

        if (index === -1) {
            // 如果没找到比当前时间大的，说明是最后一句
            currentLineIndex.value = lines.value.length - 1;
        } else if (index > 0) {
            currentLineIndex.value = index - 1;
        } else {
            currentLineIndex.value = 0;
        }
    });

    // Action: 点击歌词跳转
    const seekToLine = (index: number) => {
        const line = lines.value[index];
        if (line) {
            playerStore.seek(line.time);
            // 如果当前是暂停，顺便播放
            if (!playerStore.isPlaying) {
                playerStore.togglePlay(true);
            }
        }
    };

    return {
        lines,
        currentLineIndex,
        noLyric,
        seekToLine
    };
});