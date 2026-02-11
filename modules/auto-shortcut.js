#!/usr/bin/env node
/**
 * ⚡ 康仔自动快捷生成系统 v1
 * 自主学习成果 - 2026-02-11 10:38
 * 
 * 功能:
 * - 检测重复操作模式
 * - 自动生成快捷命令
 * - 一键执行宏任务
 * - 用户确认机制
 */

const fs = require('fs');
const path = require('path');

class AutoShortcutGenerator {
  constructor(options = {}) {
    this.shortcutsFile = options.shortcutsFile || 'memory/shortcuts.json';
    this.macrosFile = options.macrosFile || 'memory/macros.json';
    this.patternsFile = options.patternsFile || 'memory/detected_patterns.json';

    this.shortcuts = this.loadShortcuts();
    this.macros = this.loadMacros();
    this.detectedPatterns = this.loadPatterns();
  }

  /**
   * 加载快捷命令
   */
  loadShortcuts() {
    try {
      if (fs.existsSync(this.shortcutsFile)) {
        return JSON.parse(fs.readFileSync(this.shortcutsFile, 'utf8'));
      }
    } catch {
      // 忽略错误
    }
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      shortcuts: []
    };
  }

  /**
   * 加载宏
   */
  loadMacros() {
    try {
      if (fs.existsSync(this.macrosFile)) {
        return JSON.parse(fs.readFileSync(this.macrosFile, 'utf8'));
      }
    } catch {
      // 忽略错误
    }
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      macros: []
    };
  }

  /**
   * 加载检测到的模式
   */
  loadPatterns() {
    try {
      if (fs.existsSync(this.patternsFile)) {
        return JSON.parse(fs.readFileSync(this.patternsFile, 'utf8'));
      }
    } catch {
      // 忽略错误
    }
    return {
      version: '1.0',
      detected: []
    };
  }

  /**
   * 分析操作历史，检测模式
   */
  detectPatterns(operations, options = {}) {
    const { minOccurrences = 3, timeWindow = 60000 } = options;
    const patterns = [];
    const seen = new Map();

    // 检测连续操作模式
    for (let i = 0; i < operations.length - 1; i++) {
      const seq = [];
      let j = i;

      // 收集连续操作序列
      while (j < operations.length - 1) {
        const curr = operations[j];
        const next = operations[j + 1];

        // 检查是否在时间窗口内
        if (next.timestamp - curr.timestamp > timeWindow) {
          break;
        }

        seq.push({ type: curr.type, action: curr.action });
        j++;
      }

      if (seq.length >= 2) {
        const key = JSON.stringify(seq);
        if (!seen.has(key)) {
          seen.set(key, { seq, count: 0, firstSeen: Date.now() });
        }
        seen.get(key).count++;
      }
    }

    // 筛选高频模式
    for (const [key, data] of seen) {
      if (data.count >= minOccurrences) {
        patterns.push({
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sequence: data.seq,
          occurrences: data.count,
          firstSeen: data.firstSeen,
          lastSeen: Date.now(),
          suggestedName: this.generateName(data.seq)
        });
      }
    }

    // 保存检测到的模式
    this.detectedPatterns.detected = patterns;
    this.savePatterns();

    return patterns;
  }

  /**
   * 生成快捷命令名称
   */
  generateName(sequence) {
    const actions = sequence.map(s => s.action || s.type).slice(0, 3);
    return `快捷_${actions.join('_')}`;
  }

  /**
   * 从模式创建宏
   */
  createMacroFromPattern(pattern, options = {}) {
    const { requireConfirm = true } = options;

    const macro = {
      id: pattern.id,
      name: pattern.suggestedName,
      description: `自动检测到的操作序列，共执行${pattern.occurrences}次`,
      steps: pattern.sequence,
      metadata: {
        createdFrom: 'pattern_detection',
        occurrences: pattern.occurrences,
        createdAt: new Date().toISOString()
      },
      enabled: !requireConfirm, // 如果需要确认，默认禁用
      usageCount: 0
    };

    this.macros.macros.push(macro);
    this.saveMacros();

    return macro;
  }

  /**
   * 手动创建快捷命令
   */
  createShortcut(options = {}) {
    const {
      name,
      command,
      description = '',
      icon = '⚡',
      tags = [],
      hotkey = null
    } = options;

    const shortcut = {
      id: `shortcut_${Date.now()}`,
      name,
      command,
      description,
      icon,
      tags,
      hotkey,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    this.shortcuts.shortcuts.push(shortcut);
    this.saveShortcuts();

    return shortcut;
  }

  /**
   * 执行快捷命令
   */
  async executeShortcut(shortcutId) {
    const shortcut = this.shortcuts.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) {
      return { success: false, error: '快捷命令不存在' };
    }

    // 增加使用计数
    shortcut.usageCount++;
    this.saveShortcuts();

    // 返回命令供执行
    return {
      success: true,
      command: shortcut.command,
      shortcut
    };
  }

  /**
   * 执行宏
   */
  async executeMacro(macroId, executor) {
    const macro = this.macros.macros.find(m => m.id === macroId);
    if (!macro) {
      return { success: false, error: '宏不存在' };
    }

    if (!macro.enabled) {
      return { success: false, error: '宏已禁用', macro };
    }

    // 增加使用计数
    macro.usageCount++;
    macro.lastExecuted = new Date().toISOString();
    this.saveMacros();

    // 执行每一步
    const results = [];
    for (const step of macro.steps) {
      try {
        const result = await executor ? executor(step) : { step, message: '模拟执行' };
        results.push({ ...step, result });
      } catch (error) {
        results.push({ ...step, error: error.message });
      }
    }

    return {
      success: true,
      macro,
      results
    };
  }

  /**
   * 建议快捷命令
   */
  suggestShortcuts(patterns) {
    const suggestions = [];

    for (const pattern of patterns) {
      // 检查是否已存在相似快捷
      const exists = this.macros.macros.some(m => 
        JSON.stringify(m.steps) === JSON.stringify(pattern.sequence)
      );

      if (!exists) {
        suggestions.push({
          pattern,
          confidence: Math.min(pattern.occurrences / 10, 1),
          recommendation: `建议创建宏: ${pattern.suggestedName}`,
          estimatedTimeSaved: pattern.sequence.length * 2 // 假设每步2秒
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 获取所有快捷命令
   */
  getShortcuts(filter = {}) {
    let result = this.shortcuts.shortcuts;

    if (filter.tag) {
      result = result.filter(s => s.tags.includes(filter.tag));
    }
    if (filter.enabled !== undefined) {
      result = result.filter(s => s.enabled !== false);
    }

    return result.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * 获取所有宏
   */
  getMacros(filter = {}) {
    let result = this.macros.macros;

    if (filter.enabled !== undefined) {
      result = result.filter(m => m.enabled === filter.enabled);
    }

    return result.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * 启用/禁用快捷或宏
   */
  toggle(id, type = 'shortcut', enabled = true) {
    if (type === 'shortcut') {
      const shortcut = this.shortcuts.shortcuts.find(s => s.id === id);
      if (shortcut) {
        shortcut.enabled = enabled;
        this.saveShortcuts();
        return { success: true, shortcut };
      }
    } else {
      const macro = this.macros.macros.find(m => m.id === id);
      if (macro) {
        macro.enabled = enabled;
        this.saveMacros();
        return { success: true, macro };
      }
    }
    return { success: false, error: '未找到' };
  }

  /**
   * 删除快捷或宏
   */
  delete(id, type = 'shortcut') {
    if (type === 'shortcut') {
      this.shortcuts.shortcuts = this.shortcuts.shortcuts.filter(s => s.id !== id);
      this.saveShortcuts();
    } else {
      this.macros.macros = this.macros.macros.filter(m => m.id !== id);
      this.saveMacros();
    }
    return { success: true };
  }

  /**
   * 生成使用报告
   */
  generateReport() {
    const shortcuts = this.shortcuts.shortcuts;
    const macros = this.macros.macros;

    const totalShortcuts = shortcuts.length;
    const enabledShortcuts = shortcuts.filter(s => s.enabled !== false).length;
    const totalMacroUsage = macros.reduce((sum, m) => sum + m.usageCount, 0);
    const totalTimeSaved = shortcuts.reduce((sum, s) => sum + s.usageCount * 2, 0) +
                          macros.reduce((sum, m) => sum + m.usageCount * m.steps.length * 2, 0);

    return {
      title: '康仔快捷生成报告',
      generatedAt: new Date().toISOString(),
      shortcuts: {
        total: totalShortcuts,
        enabled: enabledShortcuts,
        totalUsage: shortcuts.reduce((sum, s) => sum + s.usageCount, 0)
      },
      macros: {
        total: macros.length,
        enabled: macros.filter(m => m.enabled).length,
        totalUsage: totalMacroUsage
      },
      patterns: {
        detected: this.detectedPatterns.detected.length
      },
      impact: {
        estimatedTimeSaved: `${totalTimeSaved}秒`,
        estimatedTimeSavedMinutes: `${(totalTimeSaved / 60).toFixed(1)}分钟`
      }
    };
  }

  /**
   * 保存数据
   */
  saveShortcuts() {
    fs.writeFileSync(this.shortcutsFile, JSON.stringify(this.shortcuts, null, 2));
  }

  saveMacros() {
    fs.writeFileSync(this.macrosFile, JSON.stringify(this.macros, null, 2));
  }

  savePatterns() {
    fs.writeFileSync(this.patternsFile, JSON.stringify(this.detectedPatterns, null, 2));
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      shortcutsCount: this.shortcuts.shortcuts.length,
      macrosCount: this.macros.macros.length,
      patternsDetected: this.detectedPatterns.detected.length
    };
  }
}

// CLI工具
class AutoShortcutCLI {
  constructor() {
    this.generator = new AutoShortcutGenerator();
  }

  run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'create':
        return this.create(args.slice(1));
      case 'list':
        return this.list(args.slice(1));
      case 'execute':
        return this.execute(args.slice(1));
      case 'suggest':
        return this.suggest(args.slice(1));
      case 'report':
        return this.report(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
⚡ Auto Shortcut Generator - 自动快捷生成

用法: auto-shortcut <command> [options]

命令:
  create <name> <command>  创建快捷命令
  list                    列出所有快捷
  execute <id>            执行快捷命令
  suggest                 建议快捷命令
  report                  生成使用报告

示例:
  auto-shortcut create "打开微信" "open WeChat"
  auto-shortcut list
  auto-shortcut execute shortcut_123
  auto-shortcut suggest
  auto-shortcut report
`;
  }

  create(args) {
    const name = args[0];
    const command = args[1] || '';

    if (!name) {
      console.log('❌ 请提供快捷名称');
      return;
    }

    const shortcut = this.generator.createShortcut({
      name,
      command,
      description: args[2] || ''
    });

    console.log(`✅ 快捷已创建: ${shortcut.name}`);
  }

  list(args) {
    const shortcuts = this.generator.getShortcuts();
    const macros = this.generator.getMacros();

    console.log(`\n快捷命令 (${shortcuts.length}):`);
    for (const s of shortcuts) {
      console.log(`  ${s.enabled === false ? '❌' : '✅'} ${s.name} - ${s.command}`);
    }

    console.log(`\n宏 (${macros.length}):`);
    for (const m of macros) {
      console.log(`  ${m.enabled === false ? '❌' : '✅'} ${m.name} (${m.steps.length}步)`);
    }
  }

  async execute(args) {
    const id = args[0];
    if (!id) {
      console.log('❌ 请提供ID');
      return;
    }

    const result = await this.generator.executeShortcut(id);
    console.log('\n执行结果:', result);
  }

  suggest(args) {
    const patterns = this.generator.detectedPatterns.detected;
    const suggestions = this.generator.suggestShortcuts(patterns);

    console.log('\n快捷建议:');
    for (const s of suggestions.slice(0, 5)) {
      console.log(`  ${s.recommendation}`);
      console.log(`     置信度: ${(s.confidence * 100).toFixed(0)}%`);
      console.log(`     预估节省: ${s.estimatedTimeSaved}秒\n`);
    }
  }

  report(args) {
    const report = this.generator.generateReport();
    console.log('\n使用报告:');
    console.log(JSON.stringify(report, null, 2));
  }
}

module.exports = { AutoShortcutGenerator, AutoShortcutCLI };

// 测试
async function test() {
  console.log('⚡ 自动快捷生成测试\n');

  const generator = new AutoShortcutGenerator();

  // 测试创建快捷
  console.log('1. 测试创建快捷');
  const s1 = generator.createShortcut({
    name: '打开微信',
    command: 'open WeChat',
    icon: '💬'
  });
  console.log('   快捷:', s1.name);

  // 测试创建宏
  console.log('\n2. 测试创建宏');
  const macro = {
    id: 'test_macro',
    sequence: [
      { type: 'open', action: '微信' },
      { type: 'click', action: '搜索' },
      { type: 'type', action: '老板' }
    ],
    occurrences: 5,
    suggestedName: '测试宏'
  };
  const m1 = generator.createMacroFromPattern(macro);
  console.log('   宏:', m1.name);

  // 测试建议
  console.log('\n3. 测试快捷建议');
  const suggestions = generator.suggestShortcuts([macro]);
  console.log('   建议数:', suggestions.length);

  // 测试报告
  console.log('\n4. 测试报告');
  const report = generator.generateReport();
  console.log('   快捷:', report.shortcuts.total);
  console.log('   宏:', report.macros.total);

  // 测试状态
  console.log('\n5. 测试状态');
  const status = generator.getStatus();
  console.log('   状态:', status);

  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new AutoShortcutCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
