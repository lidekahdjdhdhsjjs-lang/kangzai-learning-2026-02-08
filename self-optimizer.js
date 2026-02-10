#!/usr/bin/env node
/**
 * 康仔自我优化器 - 持续进化引擎
 * 基于性能反馈自动优化参数和策略
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'memory/evolution_history.json');
const CONFIG_FILE = path.join(__dirname, 'memory/auto_optimizer_config.json');

class SelfOptimizer {
  constructor() {
    this.history = this.loadHistory();
    this.config = this.loadConfig();
  }

  loadHistory() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      console.log('📝 新建进化历史');
    }
    return {
      records: [],           // 优化记录
      performanceLog: [],    // 性能日志
      improvements: [],      // 改进历史
      version: '1.0.0',
      createdAt: new Date().toISOString()
    };
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (e) {
      console.log('📝 新建优化配置');
    }
    return {
      // 检索配置
      retrieval: {
        maxResults: 5,
        timeout: 10000,
        cacheEnabled: true
      },
      // 学习配置
      learning: {
        cycleInterval: 1800000,    // 30分钟
        maxRetries: 3,
        parallelWorkers: 2
      },
      // 预测配置
      prediction: {
        confidenceThreshold: 0.5,
        maxPredictions: 3
      },
      // 进化配置
      evolution: {
        autoOptimize: true,
        checkInterval: 3600000,    // 1小时
        minImprovement: 0.05       // 5%最小改进
      }
    };
  }

  saveHistory() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.history, null, 2));
  }

  saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  /**
   * 记录一次性能指标
   */
  logPerformance(operation, duration, success, metadata = {}) {
    this.history.performanceLog.push({
      timestamp: new Date().toISOString(),
      operation,
      duration,
      success,
      metadata
    });
    
    // 保留最近1000条记录
    if (this.history.performanceLog.length > 1000) {
      this.history.performanceLog = this.history.performanceLog.slice(-1000);
    }
    
    this.saveHistory();
  }

  /**
   * 分析性能数据
   */
  analyzePerformance(operation = null) {
    const logs = operation 
      ? this.history.performanceLog.filter(l => l.operation === operation)
      : this.history.performanceLog;
    
    if (logs.length === 0) {
      return { success: false, message: '没有性能数据' };
    }
    
    const successful = logs.filter(l => l.success);
    const durations = logs.map(l => l.duration).filter(d => d > 0);
    
    return {
      operation: operation || 'all',
      totalCount: logs.length,
      successCount: successful.length,
      successRate: (successful.length / logs.length * 100).toFixed(2) + '%',
      avgDuration: durations.length > 0 
        ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) + 'ms'
        : 'N/A',
      minDuration: durations.length > 0 ? Math.min(...durations) + 'ms' : 'N/A',
      maxDuration: durations.length > 0 ? Math.max(...durations) + 'ms' : 'N/A'
    };
  }

  /**
   * 主动优化
   */
  optimize() {
    if (!this.config.evolution.autoOptimize) {
      return { success: false, message: '自动优化已禁用' };
    }

    const improvements = [];
    
    // 分析检索性能
    const retrievalPerf = this.analyzePerformance('search');
    if (retrievalPerf.successRate < '95%') {
      // 优化检索配置
      if (parseFloat(retrievalPerf.successRate) < 90) {
        this.config.retrieval.maxResults = Math.min(10, this.config.retrieval.maxResults + 1);
        improvements.push({
          type: 'retrieval',
          change: 'maxResults increased',
          reason: 'success rate low'
        });
      }
    }
    
    // 分析学习性能
    const learningPerf = this.analyzePerformance('learn');
    if (learningPerf.avgDuration > '5000ms') {
      this.config.learning.parallelWorkers = Math.min(4, this.config.learning.parallelWorkers + 1);
      improvements.push({
        type: 'learning',
        change: 'parallelWorkers increased',
        reason: 'learning too slow'
      });
    }
    
    // 记录优化
    if (improvements.length > 0) {
      this.history.improvements.push({
        timestamp: new Date().toISOString(),
        changes: improvements,
        trigger: 'auto_optimize'
      });
      this.saveConfig();
      this.saveHistory();
      
      return {
        success: true,
        improvements,
        config: this.config
      };
    }
    
    return {
      success: true,
      message: '无需优化，性能良好',
      config: this.config
    };
  }

  /**
   * 获取进化状态
   */
  getEvolutionStatus() {
    return {
      version: this.history.version,
      totalImprovements: this.history.improvements.length,
      recentPerformance: this.analyzePerformance(),
      autoOptimize: this.config.evolution.autoOptimize,
      lastOptimized: this.history.improvements.length > 0
        ? this.history.improvements[this.history.improvements.length - 1].timestamp
        : null
    };
  }

  /**
   * 获取所有配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(key, value) {
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    this.saveConfig();
    
    this.history.records.push({
      timestamp: new Date().toISOString(),
      action: 'config_update',
      key,
      value
    });
    
    console.log(`✅ 配置更新: ${key} = ${JSON.stringify(value)}`);
  }
}

// CLI测试
async function main() {
  console.log('🧬 自我优化器测试\n');
  
  const optimizer = new SelfOptimizer();
  
  // 模拟性能数据
  console.log('📊 记录模拟性能数据...');
  optimizer.logPerformance('search', 5, true, { query: 'test' });
  optimizer.logPerformance('search', 3, true, { query: 'AI' });
  optimizer.logPerformance('search', 8, false, { query: 'error' });
  optimizer.logPerformance('learn', 5000, true, { source: 'github' });
  
  console.log('\n📈 性能分析:');
  console.log(JSON.stringify(optimizer.analyzePerformance(), null, 2));
  
  console.log('\n🧬 进化状态:');
  console.log(JSON.stringify(optimizer.getEvolutionStatus(), null, 2));
  
  console.log('\n🔧 尝试自动优化...');
  console.log(optimizer.optimize());
  
  console.log('\n✅ 测试完成');
}

module.exports = { SelfOptimizer };

if (require.main === module) {
  main().catch(console.error);
}
