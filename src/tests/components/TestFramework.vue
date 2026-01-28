<template>
  <div v-if="isVisible" class="test-framework" :class="{ minimized: isMinimized }">
    <!-- 标题栏 -->
    <div class="test-header" @click="toggleMinimize">
      <span class="test-title">🧪 测试框架</span>
      <div class="header-controls">
        <button @click.stop="runAllTests" class="control-btn run-btn" title="运行所有测试">▶️</button>
        <button @click.stop="clearResults" class="control-btn clear-btn" title="清除结果">🗑️</button>
        <button @click.stop="closeFramework" class="control-btn close-btn" title="关闭">❌</button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div v-if="!isMinimized" class="test-content">
      <!-- 测试模块列表 -->
      <div class="test-modules">
        <h3>测试模块</h3>
        <div v-for="module in registeredModules" :key="module.name" class="module-item">
          <div class="module-info">
            <span class="module-name">{{ module.name }}</span>
            <span class="module-desc">{{ module.description }}</span>
          </div>
          <button @click="runSingleTest(module.name)" class="run-module-btn" title="运行此模块">
            运行
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="test-results" v-if="results.length > 0">
        <h3>测试结果</h3>
        <div class="results-summary">
          <span class="summary-item">总计: {{ stats.total }}</span>
          <span class="summary-item passed">通过: {{ stats.passed }}</span>
          <span class="summary-item failed">失败: {{ stats.failed }}</span>
          <span class="summary-item">通过率: {{ stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0 }}%</span>
        </div>
        
        <div class="results-details">
          <div v-for="(result, index) in results" :key="index" class="result-item" :class="{ passed: result.passed, failed: !result.passed }">
            <span class="result-icon">{{ result.passed ? '✅' : '❌' }}</span>
            <div class="result-info">
              <span class="result-name">{{ result.testName }}</span>
              <span class="result-message">{{ result.message || result.error || '' }}</span>
              <span class="result-time">{{ formatTime(result.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-else-if="!isRunning" class="no-results">
        <p>点击"运行所有测试"或选择特定模块进行测试</p>
      </div>

      <!-- 运行中提示 -->
      <div v-if="isRunning" class="running-indicator">
        <span class="spinner"></span>
        <span>正在运行测试...</span>
      </div>
    </div>

    <!-- 最小化提示 -->
    <div v-if="isMinimized" class="minimized-info">
      <span>测试框架已最小化</span>
      <span>点击标题栏展开</span>
    </div>
  </div>

  <!-- 悬浮按钮（当面板关闭时显示） -->
  <button v-if="!isVisible" @click="showFramework" class="floating-test-btn" title="显示测试框架">
    🧪
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { testRegistry } from '../utils/testRegistry'
import type { TestResult } from '../types/test.types'

// 状态管理
const isVisible = ref(false)
const isMinimized = ref(false)
const isRunning = ref(false)
const results = ref<TestResult[]>([])
const registeredModules = computed(() => testRegistry.getRegisteredTests())

// 计算属性
const stats = computed(() => {
  const stats = testRegistry.getTestStats()
  return stats
})

// 生命周期
onMounted(() => {
  // 检查是否应该自动显示测试框架
  const shouldAutoShow = import.meta.env.VITE_ENABLE_TEST_FRAMEWORK === 'true' || 
                        (import.meta.env.DEV && localStorage.getItem('testFrameworkVisible') === 'true')
  
  if (shouldAutoShow) {
    showFramework()
  }

  // 注册全局函数
  if (typeof window !== 'undefined') {
    window.showTestFramework = showFramework
    window.hideTestFramework = hideFramework
  }
})

onUnmounted(() => {
  // 清理全局函数
  if (typeof window !== 'undefined') {
    window.showTestFramework = undefined as any
    window.hideTestFramework = undefined as any
  }
})

// 方法
const showFramework = () => {
  isVisible.value = true
  localStorage.setItem('testFrameworkVisible', 'true')
}

const hideFramework = () => {
  isVisible.value = false
  localStorage.setItem('testFrameworkVisible', 'false')
}

const closeFramework = () => {
  hideFramework()
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const runAllTests = async () => {
  isRunning.value = true
  results.value = []
  
  try {
    const allResults = await testRegistry.runAllTests()
    
    // 合并所有结果
    const mergedResults: TestResult[] = []
    for (const moduleResults of allResults.values()) {
      mergedResults.push(...moduleResults)
    }
    
    results.value = mergedResults
  } catch (error) {
    console.error('测试运行失败:', error)
    results.value = [{
      testName: '测试框架错误',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date()
    }]
  } finally {
    isRunning.value = false
  }
}

const runSingleTest = async (moduleName: string) => {
  isRunning.value = true
  
  try {
    const moduleResults = await testRegistry.runTest(moduleName)
    
    // 移除该模块的旧结果
    results.value = results.value.filter(r => 
      !moduleResults.some(mr => mr.testName === r.testName)
    )
    
    // 添加新结果
    results.value.push(...moduleResults)
  } catch (error) {
    console.error(`测试模块 ${moduleName} 运行失败:`, error)
  } finally {
    isRunning.value = false
  }
}

const clearResults = () => {
  testRegistry.clearResults()
  results.value = []
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// 暴露给全局的方法
defineExpose({
  showFramework,
  hideFramework,
  runAllTests
})
</script>

<style scoped>
.test-framework {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-framework.minimized {
  width: 250px;
  height: auto;
}

.test-header {
  background: #4CAF50;
  color: white;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.test-title {
  font-weight: 600;
  font-size: 14px;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.test-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.test-modules {
  margin-bottom: 20px;
}

.test-modules h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.module-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.module-info {
  display: flex;
  flex-direction: column;
}

.module-name {
  font-weight: 500;
  font-size: 13px;
  color: #333;
}

.module-desc {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.run-module-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
}

.run-module-btn:hover {
  background: #45a049;
}

.test-results h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.results-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
}

.summary-item {
  color: #666;
}

.summary-item.passed {
  color: #4CAF50;
  font-weight: 500;
}

.summary-item.failed {
  color: #f44336;
  font-weight: 500;
}

.results-details {
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  font-size: 12px;
}

.result-item.passed {
  background: #e8f5e8;
}

.result-item.failed {
  background: #ffeaea;
}

.result-icon {
  margin-right: 8px;
  font-size: 14px;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-name {
  font-weight: 500;
  color: #333;
}

.result-message {
  color: #666;
  font-size: 11px;
}

.result-time {
  color: #999;
  font-size: 10px;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 12px;
}

.running-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
  color: #666;
  font-size: 12px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.minimized-info {
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

.floating-test-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  transition: all 0.3s;
}

.floating-test-btn:hover {
  background: #45a049;
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .test-framework {
    width: 90%;
    right: 5%;
    left: 5%;
  }
}
</style>