#!/usr/bin/env node
/**
 * 康仔智能系统 - 主动预测 + 自我进化整合
 */

const { BehaviorTracker } = require('./behavior-tracker');
const { SelfOptimizer } = require('./self-optimizer');

class KangzaiSmartSystem {
  constructor() {
    this.tracker = new BehaviorTracker();
    this.optimizer = new SelfOptimizer();
    this.initialized = false;
  }

  async init() {
    console.log('🚀 初始化康仔智能系统...\n');
    this.initialized = true;
    console.log('✅ 系统初始化完成\n');
  }

  /**
   * 记录用户交互
   */
  async recordInteraction(query, type, tags = [], channel = 'discord') {
    this.tracker.recordSession(channel, 0);
    this.tracker.recordQuery(query, type, tags);
    this.optimizer.logPerformance('interaction', 5, true, { type, queryLength: query.length });
  }

  /**
   * 主动预测用户需求
   */
  async predict() {
    if (!this.initialized) await this.init();
    
    const prediction = this.tracker.predictNeeds();
    const stats = this.tracker.getStats();
    
    return { prediction, stats, config: this.optimizer.getConfig() };
  }

  /**
   * 执行自我优化
   */
  async evolve() {
    if (!this.initialized) await this.init();
    
    console.log('🧬 执行自我进化...\n');
    const perf = this.optimizer.analyzePerformance();
    console.log('📊 性能分析:', perf);
    const result = this.optimizer.optimize();
    console.log('\n🔧 优化结果:', result);
    return result;
  }

  /**
   * 获取系统状态
   */
  async getStatus() {
    if (!this.initialized) await this.init();
    
    return {
      tracker: this.tracker.getStats(),
      optimizer: this.optimizer.getEvolutionStatus(),
      config: this.optimizer.getConfig()
    };
  }

  /**
   * 智能建议
   */
  async getSuggestion() {
    const prediction = await this.predict();
    const evolution = this.optimizer.getEvolutionStatus();
    const stats = this.tracker.getStats();
    const suggestions = [];
    
    if (prediction.prediction.predictions.length > 0) {
      suggestions.push({
        type: 'prediction',
        message: `💡 现在是${prediction.prediction.currentPeriod}，${prediction.prediction.predictions[0].message}`
      });
    }
    
    if (parseFloat(evolution.recentPerformance.successRate) < 90) {
      suggestions.push({
        type: 'performance',
        message: `⚠️ 成功率${evolution.recentPerformance.successRate}，正在自动优化...`
      });
    }
    
    if (stats.totalQueries < 10) {
      suggestions.push({
        type: 'learning',
        message: '📚 多和我交流，我会更好地了解你的需求模式'
      });
    }
    
    return suggestions;
  }
}

// CLI测试
async function main() {
  console.log('🧠 康仔智能系统测试\n');
  
  const system = new KangzaiSmartSystem();
  
  console.log('📝 模拟用户交互...');
  await system.recordInteraction('今天GitHub有什么趋势', 'github', ['tech', 'trending']);
  await system.recordInteraction('播放音乐放松一下', 'music', ['entertainment']);
  await system.recordInteraction('我的项目进度怎么样', 'status', ['project']);
  
  console.log('\n🔮 需求预测:');
  console.log(JSON.stringify(await system.predict(), null, 2));
  
  console.log('\n💡 智能建议:');
  console.log(JSON.stringify(await system.getSuggestion(), null, 2));
  
  console.log('\n✅ 测试完成');
}

module.exports = { KangzaiSmartSystem };

if (require.main === module) {
  main().catch(console.error);
}
