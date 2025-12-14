export interface LyricLine {
  time: number; // 秒
  text: string; // 歌词文本
}

// 将 [00:12.34]歌词 转换为对象
export function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  
  // 正则匹配时间标签 [mm:ss.xx]
  const timeReg = /\[(\d{2}):(\d{2})(\.\d{2,3})?\]/;

  for (const line of lines) {
    const match = timeReg.exec(line);
    if (match) {
      // 分钟 * 60 + 秒
      const min = parseInt(match[1] || '0');
      const sec = parseFloat((match[2] || '0') + (match[3] || ''));
      const time = min * 60 + sec;
      const text = line.replace(timeReg, '').trim();

      if (text) {
        result.push({ time, text });
      }
    }
  }
  
  // 按时间排序，防止乱序
  return result.sort((a, b) => a.time - b.time);
}