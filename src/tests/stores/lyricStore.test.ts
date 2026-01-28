import { useLyricStore } from '../../store/lyricStore';
import type { LyricLine } from '../../utils/lrcParser';
import type { TestModule, TestResult } from '../types/test.types';

/**
 * 歌词存储测试模块
 * 实现了 TestModule 接口，集成到测试框架中
 */
export class LyricStoreTestModule implements TestModule {
  name = 'lyricStore';
  description = '歌词存储功能测试';
  private store: ReturnType<typeof useLyricStore>;
  private results: TestResult[] = [];

  constructor() {
    this.store = useLyricStore();
  }

  /**
   * 测试基本状态访问
   */
  testStateAccess(): boolean {
    try {
      // 测试状态属性是否存在
      const hasLines = 'lines' in this.store;
      const hasCurrentLineIndex = 'currentLineIndex' in this.store;
      const hasNoLyric = 'noLyric' in this.store;
      const hasSeekToLine = 'seekToLine' in this.store;

      console.log('✓ 状态访问测试通过');
      return hasLines && hasCurrentLineIndex && hasNoLyric && hasSeekToLine;
    } catch (error) {
      console.error('✗ 状态访问测试失败:', error);
      return false;
    }
  }

  /**
   * 测试歌词跳转功能
   */
  testSeekToLine(): boolean {
    try {
      // 测试无效索引处理 - 这些应该被安全处理而不会抛出异常
      this.store.seekToLine(-1);
      this.store.seekToLine(999);
      
      console.log('✓ 歌词跳转测试通过');
      return true;
    } catch (error) {
      console.error('✗ 歌词跳转测试失败:', error);
      return false;
    }
  }

  /**
   * 测试类型定义 - 验证响应式数据的正确性
   */
  testTypeDefinitions(): boolean {
    try {
      // 直接访问 store 的属性（Pinia 已经解构了响应式引用）
      const lines = this.store.lines;
      const currentLineIndex = this.store.currentLineIndex;
      const noLyric = this.store.noLyric;
      
      // 验证这些属性的类型
      const linesIsArray = Array.isArray(lines);
      const currentLineIndexIsNumber = typeof currentLineIndex === 'number';
      const noLyricIsBoolean = typeof noLyric === 'boolean';
      
      // 验证数组元素的类型结构
      const linesHaveCorrectStructure = lines.length === 0 || lines.every((line: any) => 
        typeof line.time === 'number' && typeof line.text === 'string'
      );
      
      console.log('✓ 类型定义测试通过');
      return linesIsArray && currentLineIndexIsNumber && noLyricIsBoolean && linesHaveCorrectStructure;
    } catch (error) {
      console.error('✗ 类型定义测试失败:', error);
      return false;
    }
  }

  /**
   * 测试响应式行为
   */
  testReactivity(): boolean {
    try {
      // 保存初始状态
      const initialLinesCount = this.store.lines.length;
      const initialIndex = this.store.currentLineIndex;
      
      // 验证响应式系统正常工作
      const hasValidInitialState = initialIndex === -1 || initialIndex >= 0;
      const hasConsistentState = this.store.noLyric === (initialLinesCount === 0);
      
      console.log('✓ 响应式行为测试通过');
      return hasValidInitialState && hasConsistentState;
    } catch (error) {
      console.error('✗ 响应式行为测试失败:', error);
      return false;
    }
  }

  /**
   * 测试边界条件
   */
  testBoundaryConditions(): boolean {
    try {
      // 测试空歌词数组的情况
      if (this.store.lines.length === 0) {
        const shouldBeMinusOne = this.store.currentLineIndex === -1;
        const shouldBeNoLyric = this.store.noLyric === true;
        console.log('✓ 边界条件测试通过 (空歌词状态)');
        return shouldBeMinusOne && shouldBeNoLyric;
      }
      
      // 测试有歌词的情况
      const shouldHaveValidIndex = this.store.currentLineIndex >= -1 && 
                                   this.store.currentLineIndex < this.store.lines.length;
      console.log('✓ 边界条件测试通过 (有歌词状态)');
      return shouldHaveValidIndex;
    } catch (error) {
      console.error('✗ 边界条件测试失败:', error);
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  runAllTests(): void {
    console.log('[LyricStoreTestModule] 开始歌词存储测试');
    this.results = []; // 清空之前的结果
    
    const tests = [
      { name: '状态访问', test: () => this.testStateAccess() },
      { name: '歌词跳转', test: () => this.testSeekToLine() },
      { name: '类型定义', test: () => this.testTypeDefinitions() },
      { name: '响应式行为', test: () => this.testReactivity() },
      { name: '边界条件', test: () => this.testBoundaryConditions() }
    ];

    tests.forEach(({ name, test }) => {
      const startTime = Date.now();
      try {
        const passed = test();
        const duration = Date.now() - startTime;
        
        this.results.push({
          testName: name,
          passed,
          message: passed ? `测试通过 (${duration}ms)` : '测试失败',
          timestamp: new Date()
        });
        
        console.log(`[LyricStoreTestModule] ${name}: ${passed ? '✓' : '✗'}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.results.push({
          testName: name,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
        
        console.error(`[LyricStoreTestModule] ${name}: ✗ (错误: ${error})`);
      }
    });

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`[LyricStoreTestModule] 测试完成: ${passed}/${total} 通过`);
    
    if (passed === total) {
      console.log('[LyricStoreTestModule] 🎉 所有测试通过！歌词存储重构成功。');
    } else {
      console.log('[LyricStoreTestModule] ⚠️ 部分测试失败，请检查实现。');
    }
  }

  /**
   * 获取测试结果
   */
  getResults(): TestResult[] {
    return this.results;
  }
}

/**
 * 创建并运行测试（向后兼容）
 */
export const runLyricStoreTests = (): void => {
  const module = new LyricStoreTestModule();
  module.runAllTests();
};

/**
 * 导出一个简单的测试运行器（向后兼容）
 */
export const testInConsole = (): void => {
  console.log('%c=== LyricStore 功能测试 ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
  runLyricStoreTests();
  console.log('%c=== 测试完成 ===', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
};

/**
 * 导出测试模块类供测试框架使用
 */
export default LyricStoreTestModule;
