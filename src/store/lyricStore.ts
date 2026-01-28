import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { usePlayerStore } from './playerStore';
import { parseLrc, type LyricLine } from '../utils/lrcParser';

// ==================== 类型定义 ====================
/**
 * 歌词存储状态接口
 */
export interface LyricStoreState {
  /** 解析后的歌词行数组 */
  lines: import('vue').Ref<LyricLine[]>;
  /** 当前播放的歌词行索引，-1 表示未开始 */
  currentLineIndex: import('vue').Ref<number>;
  /** 是否显示"暂无歌词"状态 */
  noLyric: import('vue').Ref<boolean>;
}

/**
 * 歌词存储动作接口
 */
export interface LyricStoreActions {
  /**
   * 跳转到指定歌词行并播放
   * @param index - 歌词行索引
   */
  seekToLine: (index: number) => void;
}

/**
 * 歌词存储完整接口
 */
export type LyricStore = LyricStoreState & LyricStoreActions;

// ==================== 常量配置 ====================
/**
 * 模拟歌词数据 - 用于演示和测试
 * 实际开发中应从网络接口获取或读取本地 LRC 文件
 */
const MOCK_LRC = `
[00:00.00]Pixel Tune Demo
[00:02.00]Loading audio...
[00:05.00]这是一个歌词测试
[00:10.00]歌词模块与播放器解耦
[00:15.00]点击歌词可以跳转进度
[00:20.00]End
`;

// ==================== 工具函数 ====================
/**
 * 解析歌词内容
 * @param lyricContent - 原始歌词文本
 * @returns 解析后的歌词行数组，如果解析失败返回空数组
 */
const parseLyricContent = (lyricContent: string | undefined): LyricLine[] => {
  if (!lyricContent || lyricContent.trim().length === 0) {
    return [];
  }

  try {
    return parseLrc(lyricContent);
  } catch (error) {
    console.error('歌词解析失败:', error);
    return [];
  }
};

/**
 * 查找当前时间对应的歌词行索引
 * @param lines - 歌词行数组
 * @param currentTime - 当前播放时间（秒）
 * @returns 当前歌词行索引，如果未找到返回 -1
 */
const findCurrentLineIndex = (lines: LyricLine[], currentTime: number): number => {
  if (lines.length === 0) return -1;

  // 算法：找到第一个 time > 当前时间的行，它的前一行就是当前行
  const index = lines.findIndex(line => line.time > currentTime);

  if (index === -1) {
    // 如果没找到比当前时间大的，说明是最后一句
    return lines.length - 1;
  } else if (index > 0) {
    return index - 1;
  } else {
    return 0;
  }
};

// ==================== Store 定义 ====================
/**
 * 歌词状态管理 Store
 * 
 * @description
 * 负责管理歌词的解析、同步和交互功能。
 * - 监听当前歌曲变化，自动解析歌词
 * - 监听播放时间变化，同步高亮当前歌词行
 * - 提供点击歌词跳转功能
 * 
 * @example
 * ```ts
 * const lyricStore = useLyricStore();
 * // 获取当前歌词行
 * const currentLine = lyricStore.lines[lyricStore.currentLineIndex];
 * // 跳转到指定歌词
 * lyricStore.seekToLine(5);
 * ```
 */
export const useLyricStore = defineStore('lyric', (): LyricStore => {
  const playerStore = usePlayerStore();

  // ==================== 状态管理 ====================
  /** 解析后的歌词行数组 */
  const lines = ref<LyricLine[]>([]);
  /** 当前播放的歌词行索引，-1 表示未开始 */
  const currentLineIndex = ref<number>(-1);
  /** 是否显示"暂无歌词"状态 */
  const noLyric = ref<boolean>(false);

  // ==================== 核心逻辑函数 ====================
  /**
   * 重置歌词状态
   * 清空歌词数据、重置当前行索引和"无歌词"状态
   */
  const resetLyricState = (): void => {
    lines.value = [];
    currentLineIndex.value = -1;
    noLyric.value = false;
  };

  /**
   * 更新歌词数据
   * 根据歌词内容解析并更新状态
   * @param lyricContent - 原始歌词文本
   */
  const updateLyricData = (lyricContent: string | undefined): void => {
    const parsedLines = parseLyricContent(lyricContent);
    
    if (parsedLines.length > 0) {
      lines.value = parsedLines;
      noLyric.value = false;
    } else {
      lines.value = [];
      noLyric.value = true;
    }
  };

  /**
   * 处理歌曲变化
   * 当当前歌曲发生变化时，重新解析歌词
   * @param songData - 歌曲数据或 null
   */
  const handleSongChange = (songData: { id: string; lyric?: string } | null): void => {
    resetLyricState();

    if (!songData) return;

    updateLyricData(songData.lyric);
  };

  // ==================== 监听器配置 ====================
  /**
   * 监听当前歌曲变化
   * 监听歌曲 ID 和歌词内容的组合，确保切歌或歌词更新都能触发
   */
  watch(
    () => {
      const song = playerStore.currentSong;
      return song ? { id: song.id, lyric: song.lyric } : null;
    },
    handleSongChange,
    { immediate: true } // 立即执行一次，防止刷新后没歌词
  );

  /**
   * 监听播放时间变化，同步歌词高亮
   * 根据当前播放时间计算应该高亮的歌词行
   */
  watch(
    () => playerStore.currentTime,
    (currentTime: number) => {
      if (lines.value.length === 0) return;
      
      currentLineIndex.value = findCurrentLineIndex(lines.value, currentTime);
    }
  );

  // ==================== 动作函数 ====================
  /**
   * 跳转到指定歌词行并播放
   * @param index - 歌词行索引
   * @throws {Error} 当索引无效或歌词行不存在时抛出错误
   */
  const seekToLine = (index: number): void => {
    // 参数验证
    if (index < 0 || index >= lines.value.length) {
      console.warn(`无效的歌词行索引: ${index}, 有效范围: 0-${lines.value.length - 1}`);
      return;
    }

    const targetLine = lines.value[index];
    if (!targetLine) {
      console.warn(`歌词行不存在: ${index}`);
      return;
    }

    try {
      // 跳转到指定时间
      playerStore.seek(targetLine.time);
      
      // 如果当前是暂停状态，开始播放
      if (!playerStore.isPlaying) {
        playerStore.togglePlay(true);
      }
    } catch (error) {
      console.error('跳转歌词失败:', error);
    }
  };

  // ==================== 返回值 ====================
  return {
    // 状态
    lines,
    currentLineIndex,
    noLyric,
    
    // 动作
    seekToLine
  };
});