#!/usr/bin/env node
/**
 * 📊 康仔操作历史分析系统 v1
 * 自主学习成果 - 2026-02-11 10:32
 * 
 * 功能:
 * - 统计分析操作频率
 * - 发现使用习惯
 * - 预测未来操作
 * - 生成智能建议
 */

const fs = require('fs');
const path = require('path');

class OperationHistoryAnalyzer {
  constructor(options = {}) {
    this.historyFile = options.historyFile || 'memory/operation_history.json';
    this.analysisFile = options.analysisFile || 'memory/operation_analysis.json';
    this.history = this.loadHistory();
    this.analysis = this.loadAnalysis();
  }

  /**
   * 加载历史记录
   */
  loadHistory() {
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
      operations: []
    };
  }

  /**
   * 加载分析结果
   */
  loadAnalysis() {
    try {
      if (fs.existsSync(this.analysisFile)) {
        return JSON.parse(fs.readFileSync(this.analysisFile, 'utf8'));
      }
    } catch {
      // 忽略错误
    }
    return {
      version: '1.0',
      lastAnalyzed: null
    };
  }

  /**
   * 记录操作
   */
  record(operation) {
    const record = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: operation.type || 'unknown',
      action: operation.action || '',
      target: operation.target || '',
      duration: operation.duration || 0,
      success: operation.success !== false,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      metadata: operation.metadata || {}
    };

    this.history.operations.push(record);
    this.saveHistory();

    return record;
  }

  /**
   * 分析操作历史
   */
  analyze(options = {}) {
    const { days = 7, limit = 1000 } = options;

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentOps = this.history.operations.filter(op => op.timestamp > cutoff).slice(-limit);

    const analysis = {
      timestamp: new Date().toISOString(),
      period: `${days}天`,
      totalOperations: recentOps.length,
      
      // 操作类型统计
      typeStats: this.analyzeTypes(recentOps),
      
      // 时间分析
      timeAnalysis: this.analyzeTime(recentOps),
      
      // 成功率分析
      successRate: this.analyzeSuccess(recentOps),
      
      // 常用操作
      frequentActions: this.findFrequentActions(recentOps),
      
      // 使用模式
      patterns: this.findPatterns(recentOps),
      
      // 习惯发现
      habits: this.findHabits(recentOps),
      
      // 预测
      predictions: this.generatePredictions(recentOps),
      
      // 建议
      suggestions: this.generateSuggestions(recentOps)
    };

    this.analysis = analysis;
    this.saveAnalysis();

    return analysis;
  }

  /**
   * 分析操作类型
   */
  analyzeTypes(operations) {
    const stats = {};
    
    for (const op of operations) {
      const key = op.type;
      if (!stats[key]) {
        stats[key] = {
          type: key,
          count: 0,
          successCount: 0,
          totalDuration: 0
        };
      }
      stats[key].count++;
      if (op.success) {
        stats[key].successCount++;
      }
      if (op.duration) {
        stats[key].totalDuration += op.duration;
      }
    }

    // 计算成功率
    for (const key of Object.keys(stats)) {
      stats[key].successRate = (stats[key].successCount / stats[key].count * 100).toFixed(1) + '%';
      stats[key].avgDuration = Math.round(stats[key].totalDuration / stats[key].count) + 'ms';
    }

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }

  /**
   * 分析时间分布
   */
  analyzeTime(operations) {
    const hourStats = {};
    const dayStats = {};
    const hourlyTotal = new Array(24).fill(0);

    for (const op of operations) {
      // 按小时统计
      const hour = op.hour || new Date(op.timestamp).getHours();
      hourlyTotal[hour]++;
      
      if (!hourStats[hour]) {
        hourStats[hour] = 0;
      }
      hourStats[hour] = (hourStats[hour] || 0) + 1;

      // 按星期统计
      const day = op.dayOfWeek || new Date(op.timestamp).getDay();
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      if (!dayStats[dayNames[day]]) {
        dayStats[dayNames[day]] = 0;
      }
      dayStats[dayNames[day]] = (dayStats[dayNames[day]] || 0) + 1;
    }

    // 找出高峰时段
    const peakHour = Object.entries(hourStats).sort((a, b) => b[1] - a[1])[0];
    const peakDay = Object.entries(dayStats).sort((a, b) => b[1] - a[1])[0];

    return {
      hourly: hourlyTotal,
      byHour: hourStats,
      byDay: dayStats,
      peakHour: peakHour ? { hour: peakHour[0], count: peakHour[1] } : null,
      peakDay: peakDay ? { day: peakDay[0], count: peakDay[1] } : null
    };
  }

  /**
   * 分析成功率
   */
  analyzeSuccess(operations) {
    const total = operations.length;
    const success = operations.filter(op => op.success).length;
    const failed = total - success;

    return {
      total,
      success,
      failed,
      rate: total > 0 ? ((success / total) * 100).toFixed(1) + '%' : 'N/A'
    };
  }

  /**
   * 找出频繁操作
   */
  findFrequentActions(operations, limit = 10) {
    const actionCounts = {};

    for (const op of operations) {
      const key = `${op.type}:${op.action}`;
      if (!actionCounts[key]) {
        actionCounts[key] = {
          type: op.type,
          action: op.action,
          count: 0,
          successRate: 0
        };
      }
      actionCounts[key].count++;
    }

    return Object.values(actionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 发现使用模式
   */
  findPatterns(operations) {
    const patterns = [];

    // 检查连续相同操作
    let consecutiveCount = 1;
    let lastType = null;

    for (const op of operations.slice(-100)) {
      if (op.type === lastType) {
        consecutiveCount++;
      } else {
        if (consecutiveCount >= 3) {
          patterns.push({
            type: 'consecutive',
            description: `连续${consecutiveCount}次${lastType}操作`,
            count: consecutiveCount
          });
        }
        consecutiveCount = 1;
        lastType = op.type;
      }
    }

    // 检查快速重复操作
    const recentOps = operations.slice(-50);
    const rapidOps = recentOps.filter((op, i) => {
      if (i === 0) return false;
      const prev = recentOps[i - 1];
      return op.timestamp - prev.timestamp < 1000; // 1秒内
    });

    if (rapidOps.length > 5) {
      patterns.push({
        type: 'rapid',
        description: '检测到快速连续操作',
        count: rapidOps.length
      });
    }

    return patterns;
  }

  /**
   * 发现习惯
   */
  findHabits(operations) {
    const habits = [];
    const timeAnalysis = this.analyzeTime(operations);

    // 时间习惯
    if (timeAnalysis.peakHour) {
      habits.push({
        category: 'time',
        description: `通常在${timeAnalysis.peakHour.hour}点最活跃`,
        confidence: Math.min(timeAnalysis.peakHour.count / operations.length * 10, 1)
      });
    }

    // 操作习惯
    const typeStats = this.analyzeTypes(operations);
    if (typeStats.length > 0) {
      habits.push({
        category: 'operation',
        description: `主要使用${typeStats[0].type}操作`,
        confidence: typeStats[0].count / operations.length
      });
    }

    return habits;
  }

  /**
   * 生成预测
   */
  generatePredictions(operations) {
    const predictions = [];
    const timeAnalysis = this.analyzeTime(operations);
    const now = new Date();
    const currentHour = now.getHours();

    // 预测当前时段活跃度
    const hourCount = timeAnalysis.byHour[currentHour] || 0;
    const avgHourly = operations.length / 24;
    
    if (hourCount > avgHourly * 1.5) {
      predictions.push({
        type: 'activity',
        prediction: '当前时段活跃度高于平均',
        confidence: hourCount / avgHourly
      });
    }

    // 预测最可能的下一步操作
    const frequent = this.findFrequentActions(operations, 3);
    if (frequent.length > 0) {
      predictions.push({
        type: 'next_action',
        prediction: `最可能执行: ${frequent[0].type}`,
        confidence: frequent[0].count / operations.length
      });
    }

    return predictions;
  }

  /**
   * 生成建议
   */
  generateSuggestions(operations) {
    const suggestions = [];
    const typeStats = this.analyzeTypes(operations);

    // 成功率建议
    for (const stat of typeStats) {
      const successRate = parseFloat(stat.successRate);
      if (successRate < 80 && stat.count > 5) {
        suggestions.push({
          priority: 'high',
          category: 'improvement',
          title: '提高操作成功率',
          description: `${stat.type}操作成功率${stat.successRate}，建议优化`,
          relatedType: stat.type
        });
      }
    }

    // 高频操作建议
    if (typeStats.length > 0 && typeStats[0].count > 10) {
      suggestions.push({
        priority: 'medium',
        category: 'automation',
        title: '考虑创建快捷方式',
        description: `${typeStats[0].type}操作频繁(${typeStats[0].count}次)，可创建快捷方式`,
        relatedType: typeStats[0].type
      });
    }

    return suggestions;
  }

  /**
   * 生成完整报告
   */
  generateReport(days = 7) {
    const analysis = this.analyze({ days });

    return {
      title: '康仔操作历史分析报告',
      generatedAt: new Date().toISOString(),
      period: `${days}天`,
      
      // 概览
      overview: {
        totalOperations: analysis.totalOperations,
        successRate: analysis.successRate.rate
      },

      // 操作类型TOP5
      topOperations: analysis.typeStats.slice(0, 5),

      // 时间分布
      timeAnalysis: analysis.timeAnalysis,

      // 习惯
      habits: analysis.habits,

      // 预测
      predictions: analysis.predictions,

      // 建议
      suggestions: analysis.suggestions
    };
  }

  /**
   * 保存历史
   */
  saveHistory() {
    // 只保留最近10000条
    if (this.history.operations.length > 10000) {
      this.history.operations = this.history.operations.slice(-10000);
    }
    fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
  }

  /**
   * 保存分析结果
   */
  saveAnalysis() {
    this.analysis.lastAnalyzed = new Date().toISOString();
    fs.writeFileSync(this.analysisFile, JSON.stringify(this.analysis, null, 2));
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      totalOperations: this.history.operations.length,
      lastOperation: this.history.operations[this.history.operations.length - 1],
      lastAnalyzed: this.analysis.lastAnalyzed
    };
  }
}

// CLI工具
class AnalyzerCLI {
  constructor() {
    this.analyzer = new OperationHistoryAnalyzer();
  }

  run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'record':
        return this.record(args.slice(1));
      case 'analyze':
        return this.analyze(args.slice(1));
      case 'report':
        return this.report(args.slice(1));
      case 'status':
        return this.status(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
📊 Operation History Analyzer - 操作历史分析

用法: op-analyzer <command> [options]

命令:
  record <type> <action>  记录操作
  analyze [days]          分析历史 (默认7天)
  report [days]           生成报告 (默认7天)
  status                  查看状态

示例:
  op-analyzer record click "确定按钮"
  op-analyzer analyze 7
  op-analyzer report > report.md
`;
  }

  record(args) {
    const type = args[0];
    const action = args[1] || '';
    
    if (!type) {
      console.log('❌ 请提供操作类型');
      return;
    }

    const record = this.analyzer.record({ type, action });
    console.log(`✅ 已记录: ${type} - ${action}`);
  }

  analyze(args) {
    const days = parseInt(args[0]) || 7;
    const analysis = this.analyzer.analyze({ days });
    console.log('\n分析结果:');
    console.log(JSON.stringify(analysis, null, 2));
  }

  report(args) {
    const days = parseInt(args[0]) || 7;
    const report = this.analyzer.generateReport(days);
    console.log(JSON.stringify(report, null, 2));
  }

  status(args) {
    const status = this.analyzer.getStatus();
    console.log('\n状态:');
    console.log(JSON.stringify(status, null, 2));
  }
}

module.exports = { OperationHistoryAnalyzer, AnalyzerCLI };

// 测试
async function test() {
  console.log('📊 操作历史分析测试\n');

  const analyzer = new OperationHistoryAnalyzer();

  // 测试记录
  console.log('1. 测试记录操作');
  analyzer.record({ type: 'click', action: '确定按钮', success: true });
  analyzer.record({ type: 'type', action: '输入文字', success: true });
  analyzer.record({ type: 'open', action: '微信', success: true });
  console.log('   记录数:', analyzer.history.operations.length);

  // 测试分析
  console.log('\n2. 测试分析');
  const analysis = analyzer.analyze({ days: 7 });
  console.log('   总操作:', analysis.totalOperations);
  console.log('   成功率:', analysis.successRate.rate);
  console.log('   TOP操作:', analysis.typeStats.length);

  // 测试报告
  console.log('\n3. 测试报告');
  const report = analyzer.generateReport(7);
  console.log('   习惯:', report.habits.length);
  console.log('   建议:', report.suggestions.length);

  // 测试状态
  console.log('\n4. 测试状态');
  const status = analyzer.getStatus();
  console.log('   总操作:', status.totalOperations);

  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new AnalyzerCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
