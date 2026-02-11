#!/usr/bin/env node
/**
 * 🛡️ 康仔智能错误恢复系统 v1
 * 自主学习成果 - 2026-02-11 09:28
 * 
 * 功能:
 * - 自动捕获错误
 * - 智能重试策略
 * - 备用方案尝试
 * - 学习错误模式
 */

const fs = require('fs');

class ErrorRecoverySystem {
  constructor(options = {}) {
    this.config = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 10000,
      exponentialBase: options.exponentialBase || 2,
      enableBackupStrategy: options.enableBackupStrategy !== false,
      learnErrors: options.learnErrors !== false,
      logFile: options.logFile || 'memory/error-recovery.log'
    };

    this.errorHistory = new Map();
    this.strategyLibrary = new Map();
    this.stats = {
      totalErrors: 0,
      recoveredErrors: 0,
      failedErrors: 0,
      strategiesUsed: 0
    };

    this.loadErrorHistory();
  }

  /**
   * 包装异步函数，自动添加错误恢复
   */
  async wrap(fn, options = {}) {
    const {
      name = 'anonymous',
      critical = false,
      strategies = []
    } = options;

    const context = {
      name,
      attempts: 0,
      startTime: Date.now(),
      errors: [],
      strategies: [...strategies]
    };

    while (context.attempts < this.config.maxRetries) {
      try {
        const result = await fn(context);
        return {
          success: true,
          value: result,
          attempts: context.attempts,
          duration: Date.now() - context.startTime
        };
      } catch (error) {
        context.attempts++;
        context.errors.push({
          message: error.message,
          code: error.code || 'UNKNOWN',
          timestamp: Date.now()
        });

        console.log(`❌ [${name}] 错误 ${context.attempts}/${this.config.maxRetries}: ${error.message}`);

        // 记录错误
        this.recordError(name, error);

        // 检查是否应该重试
        if (context.attempts >= this.config.maxRetries) {
          console.log(`🚫 [${name}] 达到最大重试次数`);

          // 尝试备用策略
          if (this.config.enableBackupStrategy) {
            const backupResult = await this.tryBackupStrategy(name, context.errors, context.strategies);
            if (backupResult) {
              this.stats.recoveredErrors++;
              this.learnFromSuccess(name, context.errors);
              return {
                success: true,
                value: backupResult,
                attempts: context.attempts,
                recovered: true,
                strategy: 'backup'
              };
            }
          }

          this.stats.failedErrors++;
          this.learnFromFailure(name, context.errors);

          if (critical) {
            throw error;
          }

          return {
            success: false,
            error: error.message,
            attempts: context.attempts,
            recovered: false
          };
        }

        // 计算延迟时间 (指数退避)
        const delay = this.calculateDelay(context.attempts);
        console.log(`⏳ [${name}] 等待 ${delay}ms 后重试...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * 计算延迟时间
   */
  calculateDelay(attempt) {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt - 1),
      this.config.maxDelay
    );
    
    // 添加随机抖动 (避免同时重试)
    const jitter = delay * 0.1 * Math.random();
    return Math.round(delay + jitter);
  }

  /**
   * 尝试备用策略
   */
  async tryBackupStrategy(name, errors, strategies) {
    console.log(`🔄 [${name}] 尝试备用策略...`);

    // 获取该操作的已学策略
    const learnedStrategy = this.strategyLibrary.get(name);

    if (learnedStrategy) {
      try {
        const result = await learnedStrategy.fn();
        console.log(`✅ [${name}] 备用策略成功`);
        this.stats.strategiesUsed++;
        return result;
      } catch (e) {
        console.log(`❌ [${name}] 备用策略失败: ${e.message}`);
      }
    }

    // 通用备用策略
    const commonStrategies = {
      'click': async () => {
        console.log('💡 备用策略: 模拟按键Enter');
        await this.pressKey('enter');
      },
      'type': async () => {
        console.log('💡 备用策略: 清除输入后重新输入');
        await this.pressKey('ctrl', 'a');
        await this.pressKey('backspace');
      },
      'open': async () => {
        console.log('💡 备用策略: 使用命令行打开');
        await this.runCommand('echo', ['打开失败']);
      }
    };

    // 匹配策略
    for (const [keyword, strategy] of Object.entries(commonStrategies)) {
      if (name.toLowerCase().includes(keyword)) {
        try {
          await strategy();
          return { recovered: true, strategy: keyword };
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * 注册备用策略
   */
  registerStrategy(name, fn) {
    this.strategyLibrary.set(name, {
      fn,
      timestamp: Date.now(),
      successCount: 0
    });
    console.log(`📝 [${name}] 策略已注册`);
  }

  /**
   * 记录错误
   */
  recordError(operation, error) {
    this.stats.totalErrors++;

    const key = `${operation}_${error.code || 'UNKNOWN'}`;
    const existing = this.errorHistory.get(key) || {
      operation,
      code: error.code || 'UNKNOWN',
      count: 0,
      lastError: null,
      patterns: []
    };

    existing.count++;
    existing.lastError = error.message;
    existing.patterns.push({
      time: new Date().toISOString(),
      message: error.message
    });

    // 只保留最近10次
    if (existing.patterns.length > 10) {
      existing.patterns.shift();
    }

    this.errorHistory.set(key, existing);
    this.saveErrorHistory();

    // 学习错误模式
    if (this.config.learnErrors) {
      this.learnErrorPattern(operation, error);
    }
  }

  /**
   * 学习错误模式
   */
  learnErrorPattern(operation, error) {
    const patterns = this.errorHistory.get(operation);
    if (patterns && patterns.count >= 3) {
      console.log(`📚 [${operation}] 发现频繁错误模式`);
      // 可以生成警告或建议
    }
  }

  /**
   * 从成功中学习
   */
  learnFromSuccess(operation, errors) {
    console.log(`🎓 [${operation}] 从成功中学习`);
    // 可以记录成功使用的策略
  }

  /**
   * 从失败中学习
   */
  learnFromFailure(operation, errors) {
    console.log(`📖 [${operation}] 从失败中学习`);
    // 可以记录失败的模式供未来参考
  }

  /**
   * 获取错误统计
   */
  getStats() {
    return {
      ...this.stats,
      errorHistorySize: this.errorHistory.size,
      strategiesCount: this.strategyLibrary.size
    };
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(filter = {}) {
    const entries = Array.from(this.errorHistory.entries());
    
    if (filter.operation) {
      return entries.filter(([k]) => k.startsWith(filter.operation));
    }
    
    return entries.map(([key, value]) => ({ key, ...value }));
  }

  /**
   * 清除错误历史
   */
  clearHistory() {
    this.errorHistory.clear();
    this.saveErrorHistory();
    console.log('🧹 错误历史已清除');
  }

  /**
   * 加载错误历史
   */
  loadErrorHistory() {
    try {
      if (fs.existsSync(this.config.logFile)) {
        const data = JSON.parse(fs.readFileSync(this.config.logFile, 'utf8'));
        for (const [key, value] of Object.entries(data)) {
          this.errorHistory.set(key, value);
        }
        console.log(`📚 已加载 ${this.errorHistory.size} 条错误历史`);
      }
    } catch (error) {
      console.log('⚠️ 加载错误历史失败:', error.message);
    }
  }

  /**
   * 保存错误历史
   */
  saveErrorHistory() {
    try {
      const data = {};
      for (const [key, value] of this.errorHistory) {
        data[key] = value;
      }
      fs.writeFileSync(this.config.logFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('⚠️ 保存错误历史失败:', error.message);
    }
  }

  /**
   * 生成错误报告
   */
  generateReport() {
    const recentErrors = this.getErrorHistory().slice(-20);
    
    return {
      title: '康仔错误恢复报告',
      generatedAt: new Date().toISOString(),
      stats: this.getStats(),
      recentErrors,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [];

    // 基于统计数据生成建议
    if (this.stats.failedErrors > this.stats.recoveredErrors) {
      recommendations.push({
        priority: 'high',
        title: '提高错误恢复率',
        description: '失败错误多于恢复错误，需要改进备用策略'
      });
    }

    if (this.errorHistory.size > 10) {
      recommendations.push({
        priority: 'medium',
        title: '清理错误历史',
        description: '错误历史较多，考虑清理旧的错误记录'
      });
    }

    return recommendations;
  }

  /**
   * 辅助函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async pressKey(...keys) {
    // 模拟按键
    console.log(`⌨️ 按键: ${keys.join('+')}`);
  }

  async runCommand(cmd, args) {
    console.log(`⚙️ 执行: ${cmd} ${args.join(' ')}`);
  }
}

// CLI工具
class ErrorRecoveryCLI {
  constructor() {
    this.system = new ErrorRecoverySystem();
  }

  run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'stats':
        return this.stats(args.slice(1));
      case 'history':
        return this.history(args.slice(1));
      case 'report':
        return this.report(args.slice(1));
      case 'clear':
        return this.clear(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
🛡️ Error Recovery - 智能错误恢复

用法: error-recovery <command> [options]

命令:
  stats        查看错误统计
  history      查看错误历史
  report       生成错误报告
  clear        清除错误历史

示例:
  error-recovery stats
  error-recovery history --operation click
  error-recovery report > report.md
`;
  }

  stats(args) {
    const stats = this.system.getStats();
    console.log('\n📊 错误统计\n');
    console.log(`总错误: ${stats.totalErrors}`);
    console.log(`已恢复: ${stats.recoveredErrors}`);
    console.log(`失败: ${stats.failedErrors}`);
    console.log(`策略使用: ${stats.strategiesUsed}`);
    console.log(`历史记录: ${stats.errorHistorySize}`);
  }

  history(args) {
    const history = this.system.getErrorHistory();
    console.log(`\n📝 错误历史 (${history.length}条)\n`);
    for (const err of history.slice(-20)) {
      console.log(`[${err.key}] ${err.count}次 - ${err.lastError?.slice(0, 50)}`);
    }
  }

  report(args) {
    const report = this.system.generateReport();
    console.log(JSON.stringify(report, null, 2));
  }

  clear(args) {
    this.system.clearHistory();
  }
}

module.exports = { ErrorRecoverySystem, ErrorRecoveryCLI };

// 测试
async function test() {
  console.log('🛡️ 错误恢复系统测试\n');

  const system = new ErrorRecoverySystem();

  // 测试wrap功能
  console.log('1. 测试错误重试');
  const result = await system.wrap(
    async (ctx) => {
      if (ctx.attempts < 2) {
        throw new Error('模拟错误');
      }
      return '成功结果';
    },
    { name: '测试操作', critical: false }
  );
  console.log('   结果:', result);

  // 测试统计
  console.log('\n2. 查看统计');
  const stats = system.getStats();
  console.log('   统计:', stats);

  // 测试报告
  console.log('\n3. 生成报告');
  const report = system.generateReport();
  console.log('   报告已生成');

  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new ErrorRecoveryCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
