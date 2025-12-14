import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import localforage from 'localforage'; // 1. 引入库

// 配置数据库信息
localforage.config({
    name: 'pixel-tune-db',
    storeName: 'songs'
});

export interface Song {
    id: string;
    name: string;
    url: string;     // 这个 URL 每次刷新都会变，只用于当前播放
    duration: number;
    lyric?: string;  // 歌词原始文本 (可选)
}

// 定义存入数据库的数据结构 (不需要存 url，但需要存文件本体)
interface SavedSong {
    id: string;
    name: string;
    file: Blob;     // 核心：存储二进制文件
    lyric?: string; // 新增：保存时也存这个字符串
}

const ALLOWED_EXTENSIONS = ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac']; // 定义允许的音频扩展名白名单 (全部小写)

export const usePlayerStore = defineStore('player', () => {
    const playlist = ref<Song[]>([]);
    const currentIndex = ref(-1);
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const audio = new Audio();

    // --- 持久化核心逻辑 ---
    // 从数据库加载 (初始化时调用)
    const loadPlaylist = async () => {
        try {
            const savedList = await localforage.getItem<SavedSong[]>('my_playlist');

            if (savedList && savedList.length > 0) {
                // 1. 恢复缓存
                savedList.forEach(item => {
                    if (item.file) {
                        (window as any)._fileCache[item.id] = item.file;
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

                // 3. 恢复索引
                if (currentIndex.value === -1) currentIndex.value = 0;

                // 如果当前有选中的歌，必须显式调用 loadSong 让 audio 知道要播哪个文件
                const songToLoad = playlist.value[currentIndex.value];
                if (songToLoad) {
                    // 这里直接赋值 src，不调用 play()
                    audio.src = songToLoad.url;
                    audio.load(); // 预加载，准备就绪
                }
            }
        } catch (error) {
            console.error('读取存档失败:', error);
        }
    };

    // 保存当前列表到数据库
    const savePlaylist = async () => {
        // 我们只存文件本体和元数据，不存那个临时的 blob url
        const dataToSave: SavedSong[] = playlist.value.map(song => ({
            id: song.id,
            name: song.name,
            file: (window as any)._fileCache?.[song.id], // 这里有个小技巧，下面会讲
            lyric: song.lyric,
        })).filter(item => item.file); // 过滤掉无效的

        await localforage.setItem('my_playlist', dataToSave);
    };

    // 为了能保存 file 对象，我们需要在内存里临时缓存一下 file
    // 因为 state 里的 playlist 只有 url，反向拿不到 file
    // const fileCache = new Map<string, File | Blob>();
    // 挂载到 window 方便 savePlaylist 读取 (或者你可以直接把 file 对象放在 playlist state 里，但要注意 Vue 响应式性能)
    (window as any)._fileCache = {};

    const currentSong = computed(() => {
        if (currentIndex.value < 0 || currentIndex.value >= playlist.value.length) {
            return null;
        }
        return playlist.value[currentIndex.value];
    });
    const initAudio = () => {
        audio.addEventListener('timeupdate', () => { currentTime.value = audio.currentTime; });
        audio.addEventListener('loadedmetadata', () => { duration.value = audio.duration; });
        audio.addEventListener('ended', () => { nextSong(); });

        // 初始化时加载存档
        loadPlaylist();
    };

    /**
     * 添加音乐文件
     * @param files 文件列表
     */
    // const addFiles = (files: FileList) => {
    //     const newSongs: Song[] = [];

    //     Array.from(files).forEach(file => {
    //         // 获取文件名后缀
    //         const parts = file.name.split('.');
    //         const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';

    //         // 检查后缀是否在白名单中
    //         // 或者使用 file.type.startsWith('audio/') 但有时候 wav/flac 的 type 可能为空，后缀判断更稳
    //         if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    //             // 如果不是音频文件，直接跳过
    //             return;
    //         }

    //         // 3. 检查当前列表里是否已经有同名歌曲
    //         const isDuplicate = playlist.value.some(song => song.name === file.name);
    //         if (isDuplicate) {
    //             console.warn(`跳过重复歌曲: ${file.name}`);
    //             return; // 跳过这一首
    //         }

    //         // 4. 生成唯一标识
    //         const id = crypto.randomUUID();
    //         const song: Song = {
    //             id,
    //             name: file.name,
    //             url: URL.createObjectURL(file),
    //             duration: 0
    //         };

    //         // 5. 缓存文件对象，用于保存
    //         (window as any)._fileCache[id] = file;
    //         newSongs.push(song);

    //     });

    //     playlist.value.push(...newSongs);

    //     // 每次添加完自动保存
    //     savePlaylist();

    //     if (currentIndex.value === -1 && playlist.value.length > 0) {
    //         currentIndex.value = 0;
    //         const firstSong = playlist.value[0];
    //         if (firstSong) {
    //             loadSong(firstSong);
    //         }
    //     }
    // };


    /**
     * 辅助函数：获取文件名（不含后缀）
     * @param filename 
     * @returns 
     */
    const getBaseName = (filename: string) => {
        return filename.substring(0, filename.lastIndexOf('.'));
    };
    /**
     * 添加文件（支持 音频 + LRC 自动匹配）
     */
    const addFiles = async (files: FileList) => {
        const newSongs: Song[] = [];

        // 1. 分类：把文件分为 音频文件 和 歌词文件
        const audioFiles: File[] = [];
        const lrcMap = new Map<string, File>(); // Key: 文件名(无后缀), Value: File对象

        Array.from(files).forEach(file => {
            const parts = file.name.split('.');
            const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';

            if (!ext) return;

            if (ALLOWED_EXTENSIONS.includes(ext)) {
                audioFiles.push(file);
            } else if (ext === 'lrc') {
                // 如果是 lrc，存入 Map 方便查找
                lrcMap.set(getBaseName(file.name), file);
            }
        });

        if (audioFiles.length === 0) return;

        // 2. 遍历音频文件，生成歌曲对象
        // 使用 Promise.all 处理可能的异步读取操作
        const processedSongs = await Promise.all(audioFiles.map(async (file) => {
            // 检查去重
            const isDuplicate = playlist.value.some(song => song.name === file.name);
            if (isDuplicate) return null;

            const id = crypto.randomUUID();
            const baseName = getBaseName(file.name);

            // --- 关键匹配逻辑 ---
            // 尝试去 lrcMap 里找同名的文件
            let lyricContent = '';
            const lrcFile = lrcMap.get(baseName);
            if (lrcFile) {
                try {
                    // 异步读取歌词文本
                    lyricContent = await lrcFile.text();
                } catch (e) {
                    console.error(`读取歌词失败: ${lrcFile.name}`, e);
                }
            }
            // --------------------

            const song: Song = {
                id,
                name: baseName, // 建议显示名字时不带后缀，比较好看
                url: URL.createObjectURL(file),
                duration: 0,
                lyric: lyricContent // 存入歌词
            };

            // 存入大文件缓存
            (window as any)._fileCache[id] = file;

            return song;
        }));

        // 3. 过滤掉 null (重复的) 并添加到列表
        const validSongs = processedSongs.filter(s => s !== null) as Song[];

        if (validSongs.length > 0) {
            playlist.value.push(...validSongs);
            savePlaylist(); // 保存

            if (currentIndex.value === -1) {
                currentIndex.value = 0;
                const firstSong = playlist.value[0];
                if (firstSong) loadSong(firstSong);
            }
        }
    };

    /**
     * 删除歌曲
     * @param index 索引
     */
    const removeSong = (index: number) => {
        const songToDelete = playlist.value[index];
        if (!songToDelete) return;

        // 清理缓存 (如果使用了 _fileCache)
        if ((window as any)._fileCache) {
            delete (window as any)._fileCache[songToDelete.id];
        }

        // --- 处理播放状态 ---
        // 情况 A: 删除的是当前正在播放的歌
        if (index === currentIndex.value) {
            togglePlay(false); // 先暂停
            audio.src = '';    // 清空音频源

            // 删除后，如果列表还有歌，尝试停留在当前位置（即下一首自动顶上来）
            // 如果删的是最后一首，索引归零或置为 -1
            if (playlist.value.length > 1) {
                // 如果删的是最后一首，播放新的最后一首 (index-1)
                // 如果删的是中间的，currentIndex 不变，指向下一首
                if (index === playlist.value.length - 1) {
                    currentIndex.value = 0; // 或者 -1 停止
                }
                // 重新加载当前索引的歌曲（因为列表变了，同样的索引现在是不同的歌）
                // 这里选择不自动播放，等待用户点击，体验更好
            } else {
                currentIndex.value = -1; // 列表空了
            }
        }
        // 情况 B: 删除的是当前播放之前的歌
        else if (index < currentIndex.value) {
            // 比如正在播第 5 首，删了第 2 首，那原来的第 5 首变成了第 4 首
            currentIndex.value--;
        }

        // 从数组移除
        playlist.value.splice(index, 1);

        // 保存更新后的列表
        savePlaylist();
    };

    /**
     * 加载歌曲
     * @param song 歌曲对象
     */
    const loadSong = (song: Song) => {
        if (!song) return;
        audio.src = song.url;
        audio.load();
    };

    const playIndex = (index: number) => {
        if (index < 0 || index >= playlist.value.length) return;
        currentIndex.value = index;
        const song = playlist.value[index];
        if (song) {
            loadSong(song);
            togglePlay(true);
        }
    };

    // --- 新增：更新指定歌曲的歌词 ---
    const updateLyric = async (index: number, lyricContent: string) => {
        const song = playlist.value[index];
        if (song) {
            // 1. 更新内存中的 State
            song.lyric = lyricContent;

            // 2. 触发保存到数据库 (因为 savePlaylist 会读取 state 中的 lyric 字段)
            await savePlaylist();

            // 3. 特殊处理：如果这首歌正在播放，需要强制触发 LyricStore 更新
            // (虽然 watch currentSong 通常能监听到，但为了保险起见，如果是修改当前歌曲，
            //  Vue 的 deep watch 性能消耗大，普通 watch 可能监听不到对象内部属性变化。
            //  最简单的 hack 是：重新赋值一下 currentSong 引用，或者依赖 lyricStore 监听 lyric 字符串变化)
        }
    };

    const togglePlay = async (forceState?: boolean) => {
        const shouldPlay = forceState ?? !isPlaying.value;

        // 安全检查：如果没有歌，或者索引越界，直接返回
        if (!currentSong.value) return;
        // 安全检查：如果 audio 没有 src (比如刚刷新完的极端情况)，重新加载一次
        if (!audio.src && currentSong.value.url) {
            audio.src = currentSong.value.url;
        }
        if (shouldPlay) {
            try {
                // 先改变 UI 状态，让用户觉得反应很快
                isPlaying.value = true;
                // 尝试播放
                await audio.play();
            } catch (error: any) {
                // 捕获 AbortError (即播放被中断)
                if (error.name === 'AbortError') {
                    console.warn('播放请求被中断，通常是因为快速点击暂停导致，可忽略。');
                } else {
                    console.error('播放出错:', error);
                    // 只有真的出错了，才把 UI 变回暂停
                    isPlaying.value = false;
                }
            }
        } else {
            audio.pause();
            isPlaying.value = false;
        }
    };

    const nextSong = () => {
        let next = currentIndex.value + 1;
        if (next >= playlist.value.length) next = 0;
        playIndex(next);
    };

    const seek = (time: number) => {
        audio.currentTime = time;
        currentTime.value = time;
    };

    initAudio();

    return {
        playlist,
        currentSong,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        addFiles,
        removeSong,
        playIndex,
        togglePlay,
        nextSong,
        seek,
        updateLyric
    };
});