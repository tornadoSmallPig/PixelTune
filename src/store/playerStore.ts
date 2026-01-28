import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import localforage from 'localforage';

// ==================== 类型定义 ====================
/**
 * Song对外的数据结构
 */
export interface Song {
    id: string;
    name: string;
    url: string;     // 这个 URL 每次刷新都会变，只用于当前播放
    duration: number;
    lyric?: string;  // 歌词原始文本 (可选)
}

/**
 * 数据库内存储歌曲结构
 */
interface SavedSong {
    id: string;
    name: string;
    file: Blob;     // 核心：存储二进制文件
    lyric?: string; // 新增：保存时也存这个字符串
}

// ==================== 常量配置 ====================
/**
 * 允许的音频文件后缀(全部小写)
 */
const ALLOWED_EXTENSIONS = ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'];

/**
 * 数据库配置
 */
localforage.config({
    name: 'pixel-tune-db',
    storeName: 'songs'
});

// ==================== 工具函数 ====================
/**
 * 获取文件名（不含后缀）
 */
const getBaseName = (filename: string): string => {
    return filename.substring(0, filename.lastIndexOf('.'));
};

/**
 * 分类文件：将文件列表分为音频文件和歌词文件
 */
const classifyFiles = (files: FileList): { audioFiles: File[]; lrcMap: Map<string, File> } => {
    const audioFiles: File[] = [];
    const lrcMap = new Map<string, File>();

    Array.from(files).forEach(file => {
        const parts = file.name.split('.');
        const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';

        if (!ext) return;

        if (ALLOWED_EXTENSIONS.includes(ext)) {
            audioFiles.push(file);
        } else if (ext === 'lrc') {
            lrcMap.set(getBaseName(file.name), file);
        }
    });

    return { audioFiles, lrcMap };
};

/**
 * 读取歌词文件内容
 */
const readLyricContent = async (lrcFile: File | undefined): Promise<string> => {
    if (!lrcFile) return '';
    
    try {
        return await lrcFile.text();
    } catch (e) {
        console.error(`读取歌词失败: ${lrcFile.name}`, e);
        return '';
    }
};

// ==================== 音频播放器管理类 ====================
class AudioPlayer {
    private audio: HTMLAudioElement;
    private currentTimeRef: Ref<number>;
    private durationRef: Ref<number>;
    private isPlayingRef: Ref<boolean>;
    private onEndedCallback?: () => void;

    constructor(
        currentTimeRef: Ref<number>,
        durationRef: Ref<number>, 
        isPlayingRef: Ref<boolean>
    ) {
        this.audio = new Audio();
        this.currentTimeRef = currentTimeRef;
        this.durationRef = durationRef;
        this.isPlayingRef = isPlayingRef;
        this.initEventListeners();
    }

    private initEventListeners(): void {
        this.audio.addEventListener('timeupdate', () => { 
            this.currentTimeRef.value = this.audio.currentTime; 
        });
        this.audio.addEventListener('loadedmetadata', () => { 
            this.durationRef.value = this.audio.duration; 
        });
        this.audio.addEventListener('ended', () => { 
            this.onEndedCallback?.(); 
        });
    }

    setOnEnded(callback: () => void): void {
        this.onEndedCallback = callback;
    }

    loadSong(song: Song): void {
        if (!song) return;
        this.audio.src = song.url;
        this.audio.load();
    }

    async play(): Promise<void> {
        try {
            this.isPlayingRef.value = true;
            await this.audio.play();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.warn('播放请求被中断，通常是因为快速点击暂停导致，可忽略。');
            } else {
                console.error('播放出错:', error);
                this.isPlayingRef.value = false;
            }
        }
    }

    pause(): void {
        this.audio.pause();
        this.isPlayingRef.value = false;
    }

    seek(time: number): void {
        this.audio.currentTime = time;
        this.currentTimeRef.value = time;
    }

    getCurrentTime(): number {
        return this.audio.currentTime;
    }

    getDuration(): number {
        return this.audio.duration;
    }
}

// ==================== 文件缓存管理 ====================
class FileCache {
    private cache: Record<string, File | Blob> = {};

    set(id: string, file: File | Blob): void {
        this.cache[id] = file;
    }

    get(id: string): File | Blob | undefined {
        return this.cache[id];
    }

    remove(id: string): void {
        delete this.cache[id];
    }

    has(id: string): boolean {
        return id in this.cache;
    }
}

// 全局文件缓存实例
const fileCache = new FileCache();

// ==================== Store 核心业务逻辑 ====================
/**
 * 播放器状态管理
 * 负责管理播放列表、当前播放状态、音频控制等核心业务逻辑
 */
export const usePlayerStore = defineStore('player', () => {
    // ==================== 状态管理 ====================
    const playlist = ref<Song[]>([]);
    const currentIndex = ref(-1);
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);

    // 音频播放器实例
    let audioPlayer: AudioPlayer;

    // 计算属性
    const currentSong = computed(() => {
        if (currentIndex.value < 0 || currentIndex.value >= playlist.value.length) {
            return null;
        }
        return playlist.value[currentIndex.value];
    });

    // ==================== 数据持久化 ====================
    /**
     * 从本地存储中加载播放列表
     * 恢复之前保存的播放列表、文件缓存和当前播放状态
     */
    const loadPlaylist = async () => {
        try {
            const savedList = await localforage.getItem<SavedSong[]>('my_playlist');
            
            if (savedList && savedList.length > 0) {
                // 1. 恢复文件缓存
                savedList.forEach(item => {
                    if (item.file) {
                        fileCache.set(item.id, item.file);
                    }
                });

                // 2. 恢复播放列表
                playlist.value = savedList.map(item => ({
                    id: item.id,
                    name: item.name,
                    url: URL.createObjectURL(item.file),
                    lyric: item.lyric || '',
                    duration: 0
                }));

                // 3. 恢复播放索引
                if (currentIndex.value === -1 && playlist.value.length > 0) {
                    currentIndex.value = 0;
                    const songToLoad = playlist.value[0];
                    if (songToLoad) {
                        audioPlayer.loadSong(songToLoad);
                    }
                }
            }
        } catch (error) {
            console.error('读取存档失败:', error);
        }
    };

    /**
     * 保存当前播放列表到本地数据库
     * 将播放列表中的歌曲信息（包括音频文件和歌词）持久化存储
     */
    const savePlaylist = async () => {
        const dataToSave: SavedSong[] = [];
        
        for (const song of playlist.value) {
            const file = fileCache.get(song.id);
            if (file) {
                dataToSave.push({
                    id: song.id,
                    name: song.name,
                    file: file,
                    lyric: song.lyric,
                });
            }
        }

        await localforage.setItem('my_playlist', dataToSave);
    };

    // ==================== 文件处理 ====================
    /**
     * 检查文件是否为重复文件
     */
    const isDuplicateFile = (file: File): boolean => {
        return playlist.value.some(song => song.name === file.name);
    };

    /**
     * 创建歌曲对象
     */
    const createSong = (file: File, lyricContent: string): Song => {
        const id = crypto.randomUUID();
        const baseName = getBaseName(file.name);

        const song: Song = {
            id,
            name: baseName,
            url: URL.createObjectURL(file),
            duration: 0,
            lyric: lyricContent
        };

        // 存入文件缓存
        fileCache.set(id, file);

        return song;
    };

    /**
     * 处理单个音频文件：检查重复、读取歌词、创建歌曲对象
     */
    const processAudioFile = async (file: File, lrcMap: Map<string, File>): Promise<Song | null> => {
        // 检查去重
        if (isDuplicateFile(file)) {
            return null;
        }

        // 读取对应的歌词内容
        const baseName = getBaseName(file.name);
        const lrcFile = lrcMap.get(baseName);
        const lyricContent = await readLyricContent(lrcFile);

        // 创建歌曲对象
        return createSong(file, lyricContent);
    };

    /**
     * 添加文件（支持音频+LRC自动匹配）
     */
    const addFiles = async (files: FileList) => {
        const { audioFiles, lrcMap } = classifyFiles(files);
        
        if (audioFiles.length === 0) return;

        const processedSongs = await Promise.all(
            audioFiles.map(file => processAudioFile(file, lrcMap))
        );

        const validSongs = processedSongs.filter((song): song is Song => song !== null);
        
        if (validSongs.length > 0) {
            addSongsToPlaylist(validSongs);
        }
    };

    // ==================== 播放控制 ====================
    /**
     * 添加歌曲到播放列表并处理自动播放逻辑
     */
    const addSongsToPlaylist = (songs: Song[]) => {
        if (songs.length === 0) return;

        playlist.value.push(...songs);
        savePlaylist();

        // 如果当前没有播放歌曲，自动播放第一首
        if (currentIndex.value === -1) {
            currentIndex.value = 0;
            const firstSong = playlist.value[0];
            if (firstSong) {
                audioPlayer.loadSong(firstSong);
            }
        }
    };

    /**
     * 播放指定索引的歌曲
     */
    const playIndex = (index: number) => {
        if (index < 0 || index >= playlist.value.length) return;
        
        currentIndex.value = index;
        const song = playlist.value[index];
        if (song) {
            audioPlayer.loadSong(song);
            audioPlayer.play();
        }
    };

    /**
     * 切换播放/暂停状态
     */
    const togglePlay = async (forceState?: boolean) => {
        const shouldPlay = forceState ?? !isPlaying.value;

        // 安全检查：如果没有歌，或者索引越界，直接返回
        if (!currentSong.value) return;
        
        if (shouldPlay) {
            await audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    };

    /**
     * 播放下一首
     */
    const nextSong = () => {
        let next = currentIndex.value + 1;
        if (next >= playlist.value.length) next = 0;
        playIndex(next);
    };

    /**
     * 跳转到指定时间
     */
    const seek = (time: number) => {
        audioPlayer.seek(time);
    };

    /**
     * 删除歌曲
     */
    const removeSong = (index: number) => {
        const songToDelete = playlist.value[index];
        if (!songToDelete) return;

        // 清理文件缓存
        fileCache.remove(songToDelete.id);

        // 处理播放状态
        const wasPlaying = index === currentIndex.value;
        
        if (wasPlaying) {
            audioPlayer.pause();
        }

        // 从数组移除
        playlist.value.splice(index, 1);

        // 调整当前索引
        if (playlist.value.length === 0) {
            currentIndex.value = -1;
        } else if (wasPlaying) {
            // 如果删除的是当前播放的歌曲，播放下一首
            if (index >= playlist.value.length) {
                currentIndex.value = 0;
            }
            const nextSong = playlist.value[currentIndex.value];
            if (nextSong) {
                audioPlayer.loadSong(nextSong);
            }
        } else if (index < currentIndex.value) {
            currentIndex.value--;
        }

        // 保存更新后的列表
        savePlaylist();
    };

    /**
     * 更新指定歌曲的歌词
     */
    const updateLyric = async (index: number, lyricContent: string) => {
        const song = playlist.value[index];
        if (song) {
            song.lyric = lyricContent;
            await savePlaylist();
        }
    };

    // ==================== 初始化 ====================
    /**
     * 初始化音频播放器
     */
    const initAudio = () => {
        audioPlayer = new AudioPlayer(currentTime, duration, isPlaying);
        audioPlayer.setOnEnded(nextSong);
        
        // 初始化时加载存档
        loadPlaylist();
    };

    // 执行初始化
    initAudio();

    // ==================== 返回值 ====================
    return {
        // 状态
        playlist,
        currentSong,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        
        // 方法
        addFiles,
        removeSong,
        playIndex,
        togglePlay,
        nextSong,
        seek,
        updateLyric
    };
});

