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
  AutoOptimizer: require('./auto-optimizer')
};
