import type { TestModule, TestRegistration, TestResult } from '../types/test.types';

/**
 * 测试注册中心
 * 负责管理所有测试模块的注册和运行
 */
class TestRegistry {
  private static instance: TestRegistry;
  private tests: Map<string, TestRegistration> = new Map();
  private results: Map<string, TestResult[]> = new Map();

  private constructor() {}

  /**
   * 获取测试注册中心的单例实例
   */
  static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  /**
   * 注册测试模块
   */
  registerTest(registration: TestRegistration): void {
    this.tests.set(registration.name, registration);
    console.log(`[TestRegistry] 注册测试模块: ${registration.name}`);
  }

  /**
   * 取消注册测试模块
   */
  unregisterTest(name: string): void {
    this.tests.delete(name);
    this.results.delete(name);
    console.log(`[TestRegistry] 取消注册测试模块: ${name}`);
  }

  /**
   * 运行指定测试模块
   */
  async runTest(name: string): Promise<TestResult[]> {
    const registration = this.tests.get(name);
    if (!registration) {
      console.warn(`[TestRegistry] 测试模块未找到: ${name}`);
      return [];
    }

    console.log(`[TestRegistry] 运行测试模块: ${name}`);
    const testInstance = new registration.TestClass();
    
    try {
      testInstance.runAllTests();
      const results = testInstance.getResults();
      this.results.set(name, results);
      return results;
    } catch (error) {
      console.error(`[TestRegistry] 测试运行失败: ${name}`, error);
      return [{
        testName: `${name} - 运行错误`,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      }];
    }
  }

  /**
   * 运行所有测试模块
   */
  async runAllTests(): Promise<Map<string, TestResult[]>> {
    console.log('[TestRegistry] 运行所有测试模块');
    const allResults = new Map<string, TestResult[]>();

    for (const [name] of this.tests) {
      const results = await this.runTest(name);
      allResults.set(name, results);
    }

    return allResults;
  }

  /**
   * 获取测试结果
   */
  getTestResults(name?: string): TestResult[] | Map<string, TestResult[]> {
    if (name) {
      return this.results.get(name) || [];
    }
    return this.results;
  }

  /**
   * 获取所有注册的测试模块
   */
  getRegisteredTests(): TestRegistration[] {
    return Array.from(this.tests.values());
  }

  /**
   * 清除所有测试结果
   */
  clearResults(): void {
    this.results.clear();
    console.log('[TestRegistry] 清除所有测试结果');
  }

  /**
   * 获取测试统计信息
   */
  getTestStats(): {
    total: number;
    passed: number;
    failed: number;
    modules: Array<{ name: string; total: number; passed: number; failed: number }>;
  } {
    let total = 0;
    let passed = 0;
    let failed = 0;
    const modules: Array<{ name: string; total: number; passed: number; failed: number }> = [];

    for (const [name, results] of this.results) {
      const moduleTotal = results.length;
      const modulePassed = results.filter(r => r.passed).length;
      const moduleFailed = moduleTotal - modulePassed;

      total += moduleTotal;
      passed += modulePassed;
      failed += moduleFailed;

      modules.push({
        name,
        total: moduleTotal,
        passed: modulePassed,
        failed: moduleFailed
      });
    }

    return { total, passed, failed, modules };
  }
}

// 导出单例实例
export const testRegistry = TestRegistry.getInstance();

/**
 * 便捷的全局测试函数
 */
export const runTest = async (name: string): Promise<TestResult[]> => {
  return testRegistry.runTest(name);
};

export const runAllTests = async (): Promise<Map<string, TestResult[]>> => {
  return testRegistry.runAllTests();
};

export const getTestResults = (name?: string): TestResult[] | Map<string, TestResult[]> => {
  return testRegistry.getTestResults(name);
};

/**
 * 全局测试控制函数
 */
declare global {
  interface Window {
    runTest: (name: string) => Promise<TestResult[]>;
    runAllTests: () => Promise<Map<string, TestResult[]>>;
    getTestResults: (name?: string) => TestResult[] | Map<string, TestResult[]>;
    showTestFramework: () => void;
    hideTestFramework: () => void;
  }
}

// 注册全局函数
if (typeof window !== 'undefined') {
  window.runTest = runTest;
  window.runAllTests = runAllTests;
  window.getTestResults = getTestResults;
}