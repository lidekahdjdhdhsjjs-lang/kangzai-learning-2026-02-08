#!/usr/bin/env node
/**
 * 康仔数字生命 - 统一入口 v1
 * Parse, Don't Validate 架构
 */

const path = require('path');

// 核心模块
const memory = require('./memory-simple');
const behavior = {
  tracker: require('./behavior-tracker'),
  predictor: require('./behavior-predictor')
};
const optimizer = require('./self-optimizer');
const smart = require('./kangzai-smart');

// 工具模块
const git = require('./github-backup');

class KangzaiDigitalEvolution {
  constructor() {
    this.version = '1.0.0';
    this.startTime = new Date();
    this.memory = new memory.KangzaiMemorySimple();
  }

  // ===== 记忆系统 =====
  
  async remember(id, content, metadata = {}) {
    return this.memory.addMemory(id, content, metadata);
  }

  async recall(query, n = 5) {
    return this.memory.search(query, n);
  }

  async forget(id) {
    this.memory.memories = this.memory.memories.filter(m => m.id !== id);
    this.memory.save();
  }

  // ===== 行为系统 =====

  async track(query, type = 'general') {
    const tracker = new behavior.tracker.BehaviorTracker();
    return tracker.track(query, type);
  }

  async predict() {
    const predictor = new behavior.predictor.BehaviorPredictor();
    return predictor.predict();
  }

  // ===== 优化系统 =====

  async optimize() {
    const optimizerInstance = new optimizer.SelfOptimizer();
    return optimizerInstance.runOptimizationCycle();
  }

  // ===== 智能系统 =====

  async think(query) {
    const smartSystem = new smart.KangzaiSmart();
    return smartSystem.think(query);
  }

  async evolve() {
    const smartSystem = new smart.KangzaiSmart();
    return smartSystem.evolve();
  }

  // ===== GitHub备份 =====

  async backup(message = '自动备份') {
    return git.backup(message);
  }

  // ===== 状态查询 =====

  async status() {
    const memStats = await this.memory.getStats();
    return {
      version: this.version,
      uptime: Date.now() - this.startTime.getTime(),
      memories: memStats.total,
      status: 'active'
    };
  }
}

// 导出
module.exports = {
  KangzaiDigitalEvolution,
  memory,
  behavior,
  optimizer,
  smart,
  git
};

// CLI
if (require.main === module) {
  const kangzai = new KangzaiDigitalEvolution();
  
  console.log('🚀 康仔数字生命 v1.0\n');
  console.log('可用方法:');
  console.log('  remember(id, content, metadata) - 添加记忆');
  console.log('  recall(query, n) - 搜索记忆');
  console.log('  track(query, type) - 追踪行为');
  console.log('  predict() - 预测需求');
  console.log('  optimize() - 自我优化');
  console.log('  think(query) - 思考');
  console.log('  evolve() - 进化');
  console.log('  status() - 状态\n');
  
  kangzai.status().then(s => console.log('状态:', s));
}
