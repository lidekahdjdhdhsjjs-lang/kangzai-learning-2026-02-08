#!/usr/bin/env node
/**
 * 📊 康仔优化历史记录系统
 * 自动记录和追踪所有优化操作
 */

const fs = require('fs');
const path = require('path');

class OptimizationHistory {
  constructor() {
    this.historyFile = 'memory/optimization_history.json';
    this.history = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.historyFile)) {
        return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      }
    } catch {
      // 忽略错误
    }
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      updates: [],
      summary: {
        totalOptimizations: 0,
        byType: {},
        byStatus: {}
      }
    };
  }

  save() {
    fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
  }

  /**
   * 记录新的优化
   */
  add(options = {}) {
    const optimization = {
      id: `opt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: options.type || 'general',
      description: options.description || '',
      file: options.file || null,
      before: options.before || {},
      after: options.after || {},
      changes: options.changes || [],
      status: options.status || 'completed', // completed, pending, reverted
      impact: options.impact || 'medium', // high, medium, low
      notes: options.notes || ''
    };

    this.history.updates.push(optimization);
    this.updateSummary(optimization);
    this.save();

    console.log(`📝 优化已记录: ${optimization.id}`);
    return optimization;
  }

  /**
   * 更新统计摘要
   */
  updateSummary(opt) {
    this.history.summary.totalOptimizations++;

    // 按类型统计
    this.history.summary.byType[opt.type] = 
      (this.history.summary.byType[opt.type] || 0) + 1;

    // 按状态统计
    this.history.summary.byStatus[opt.status] = 
      (this.history.summary.byStatus[opt.status] || 0) + 1;
  }

  /**
   * 获取优化历史
   */
  getHistory(options = {}) {
    const { type, status, limit = 50 } = options;

    let results = this.history.updates;

    if (type) {
      results = results.filter(u => u.type === type);
    }
    if (status) {
      results = results.filter(u => u.status === status);
    }

    return results.slice(-limit).reverse();
  }

  /**
   * 获取统计摘要
   */
  getSummary() {
    return this.history.summary;
  }

  /**
   * 撤销优化
   */
  revert(optimizationId) {
    const opt = this.history.updates.find(u => u.id === optimizationId);
    if (!opt) {
      return { success: false, error: '优化不存在' };
    }

    opt.status = 'reverted';
    this.updateSummary({ ...opt, status: 'reverted' });
    this.save();

    return { success: true, optimization: opt };
  }

  /**
   * 生成优化报告
   */
  generateReport() {
    const report = {
      title: '康仔优化历史报告',
      generatedAt: new Date().toISOString(),
      summary: this.history.summary,
      recentOptimizations: this.getHistory({ limit: 10 }),
      topImpactOptimizations: this.history.updates
        .filter(u => u.status === 'completed')
        .sort((a, b) => {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
        })
        .slice(0, 5)
    };

    return report;
  }

  /**
   * 快速记录 - 简化接口
   */
  log(type, description, file = null) {
    return this.add({
      type,
      description,
      file,
      impact: 'medium'
    });
  }
}

// CLI工具
class OptimizationHistoryCLI {
  constructor() {
    this.history = new OptimizationHistory();
  }

  async run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'add':
        return this.add(args.slice(1));
      case 'list':
        return this.list(args.slice(1));
      case 'summary':
        return this.summary(args.slice(1));
      case 'report':
        return this.report(args.slice(1));
      case 'revert':
        return this.revert(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
📊 Optimization History - 优化历史记录

用法: opt-history <command> [options]

命令:
  add <type> <description>  添加优化记录
  list [options]            查看优化历史
  summary                   查看统计摘要
  report                    生成完整报告
  revert <id>               撤销优化

示例:
  opt-history add code-refactor "优化extractKeywords函数"
  opt-history list --type performance
  opt-history summary
  opt-history report > report.md

选项:
  --type     筛选类型
  --status   筛选状态
  --limit    限制数量
`;
  }

  async add(args) {
    const type = args[0];
    const description = args[1] || '';
    const file = args[2] || null;

    if (!type) {
      console.log('❌ 请提供优化类型');
      return;
    }

    const opt = this.history.log(type, description, file);
    console.log('\n✅ 优化已记录:');
    console.log(JSON.stringify(opt, null, 2));
  }

  async list(args) {
    const type = this.getArg(args, ['--type']);
    const status = this.getArg(args, ['--status']);
    const limit = parseInt(this.getArg(args, ['--limit']) || '20');

    const list = this.history.getHistory({ type, status, limit });
    
    console.log(`\n📝 优化历史 (${list.length}条)\n`);
    
    for (const opt of list) {
      const statusIcon = opt.status === 'completed' ? '✅' : opt.status === 'reverted' ? '↩️' : '⏳';
      console.log(`${statusIcon} [${opt.type}] ${opt.description}`);
      console.log(`   文件: ${opt.file || 'N/A'} | 影响: ${opt.impact} | ${opt.timestamp.slice(0, 10)}`);
    }
  }

  async summary(args) {
    const summary = this.history.getSummary();
    
    console.log('\n📊 优化统计摘要\n');
    console.log(`总优化次数: ${summary.totalOptimizations}`);
    console.log('\n按类型:');
    for (const [type, count] of Object.entries(summary.byType || {})) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('\n按状态:');
    for (const [status, count] of Object.entries(summary.byStatus || {})) {
      console.log(`  ${status}: ${count}`);
    }
  }

  async report(args) {
    const report = this.history.generateReport();
    console.log(JSON.stringify(report, null, 2));
  }

  async revert(args) {
    const id = args[0];
    if (!id) {
      console.log('❌ 请提供优化ID');
      return;
    }

    const result = this.history.revert(id);
    console.log('\n撤销结果:', result);
  }

  getArg(args, flags) {
    const index = args.findIndex(a => flags.includes(a));
    return index >= 0 ? args[index + 1] : null;
  }
}

module.exports = { OptimizationHistory, OptimizationHistoryCLI };

// 测试
function test() {
  console.log('📊 Optimization History 测试\n');

  const history = new OptimizationHistory();
  
  // 添加测试记录
  console.log('1. 添加优化记录');
  const opt1 = history.log('performance', '优化记忆检索算法', 'memory-simple.js');
  console.log('   记录1:', opt1.id);

  const opt2 = history.log('refactor', '重构extractKeywords函数', 'memory-simple.js');
  console.log('   记录2:', opt2.id);

  // 查看统计
  console.log('\n2. 查看统计');
  const summary = history.getSummary();
  console.log('   总优化:', summary.totalOptimizations);

  // 查看历史
  console.log('\n3. 查看历史');
  const list = history.getHistory({ limit: 5 });
  console.log('   历史条数:', list.length);

  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new OptimizationHistoryCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
