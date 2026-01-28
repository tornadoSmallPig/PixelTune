/**
 * 测试框架类型定义
 */

/**
 * 测试模块接口
 */
export interface TestModule {
  /** 测试模块名称 */
  name: string;
  /** 测试模块描述 */
  description: string;
  /** 运行所有测试 */
  runAllTests: () => void;
  /** 获取测试结果 */
  getResults: () => TestResult[];
}

/**
 * 单个测试结果
 */
export interface TestResult {
  /** 测试名称 */
  testName: string;
  /** 是否通过 */
  passed: boolean;
  /** 测试消息 */
  message?: string;
  /** 错误信息 */
  error?: string;
  /** 测试时间 */
  timestamp: Date;
}

/**
 * 测试框架配置
 */
export interface TestFrameworkConfig {
  /** 是否启用测试框架 */
  enabled: boolean;
  /** 是否显示测试面板 */
  showPanel: boolean;
  /** 自动运行测试 */
  autoRun: boolean;
  /** 测试模块列表 */
  modules: string[];
}

/**
 * 测试注册信息
 */
export interface TestRegistration {
  /** 模块名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 测试类构造函数 */
  TestClass: new () => TestModule;
}