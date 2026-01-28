/**
 * 测试框架入口文件
 * 负责初始化测试框架和注册所有测试模块
 */

import { testRegistry } from './utils/testRegistry'
import LyricStoreTestModule from './stores/lyricStore.test'

/**
 * 初始化测试框架
 * 注册所有测试模块
 */
export function initializeTestFramework(): void {
  console.log('[TestFramework] 初始化测试框架...')
  
  // 注册歌词存储测试模块
  testRegistry.registerTest({
    name: 'lyricStore',
    description: '歌词存储功能测试',
    TestClass: LyricStoreTestModule
  })
  
  console.log('[TestFramework] 测试框架初始化完成')
}

/**
 * 开发环境下自动初始化测试框架
 */
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_FRAMEWORK === 'true') {
  // 延迟初始化，确保所有 store 都已经准备好
  setTimeout(() => {
    initializeTestFramework()
  }, 1000)
}

/**
 * 导出测试框架的主要功能
 */
export { default as TestFramework } from './components/TestFramework.vue'
export { testRegistry } from './utils/testRegistry'
export type { TestModule, TestResult, TestFrameworkConfig } from './types/test.types'

/**
 * 便捷的全局测试函数（用于浏览器控制台）
 */
export const runLyricStoreTest = (): void => {
  testRegistry.runTest('lyricStore')
}

export const runAllTests = (): void => {
  testRegistry.runAllTests()
}

export const getTestStats = () => {
  return testRegistry.getTestStats()
}