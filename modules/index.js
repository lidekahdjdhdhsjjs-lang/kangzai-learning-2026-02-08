#!/usr/bin/env node
/**
 * 📦 康仔模块索引
 * 统一导出所有模块
 */

module.exports = {
  // OCR文字识别
  OCR: require('./ocr'),
  
  // 图像匹配
  ImageMatcher: require('./image-matcher'),
  
  // 优化历史
  OptimizationHistory: require('./optimization-history'),
  
  // 自动优化
  AutoOptimizer: require('./auto-optimizer'),
  
  // 自然语言解析 (2026-02-11)
  NLPParser: require('./nlp-parser'),

  // 错误自动恢复 (2026-02-11)
  ErrorRecovery: require('./error-recovery'),

  // 操作历史分析 (2026-02-11)
  OperationAnalyzer: require('./operation-analyzer'),

  // 自动快捷生成 (2026-02-11)
  AutoShortcut: require('./auto-shortcut')
};
