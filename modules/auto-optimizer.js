#!/usr/bin/env node
/**
 * ⚡ 康仔自动优化采纳系统
 * 自动分析代码并应用优化建议
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AutoOptimizer {
  constructor() {
    this.suggestions = [];
    this.config = {
      autoApply: false,        // 是否自动应用优化
      confirmBeforeApply: true, // 应用前是否确认
      maxOptimizations: 5,     // 每次最大优化数
      ignoredPatterns: [
        'node_modules',
        '.git',
        'dist',
        'build'
      ]
    };

    this.loadConfig();
    try {
      const HistoryModule = require('./optimization-history');
      this.history = new HistoryModule.OptimizationHistory();
    } catch {
      this.history = null;
    }
  }

  loadConfig() {
    const configFile = 'memory/auto_optimizer_config.json';
    try {
      if (fs.existsSync(configFile)) {
        const saved = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        this.config = { ...this.config, ...saved };
      }
    } catch {
      // 使用默认配置
    }
  }

  saveConfig() {
    const configFile = 'memory/auto_optimizer_config.json';
    fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2));
  }

  /**
   * 分析代码质量
   */
  async analyzeCode(filePath) {
    if (!fs.existsSync(filePath)) {
      return { error: '文件不存在' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const suggestions = [];

    // 1. 检查TODO/FIXME
    const todos = lines
      .map((line, i) => ({ line: i + 1, text: line }))
      .filter(l => /TODO|FIXME|HACK|XXX/.test(l.text));

    if (todos.length > 0) {
      suggestions.push({
        type: 'cleanup',
        severity: 'medium',
        file: filePath,
        description: `发现 ${todos.length} 个待处理标记`,
        recommendation: '清理或完成这些TODO标记',
        fixable: false
      });
    }

    // 2. 检查重复代码
    const duplicates = this.findDuplicates(lines);
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'refactor',
        severity: 'high',
        file: filePath,
        description: '发现重复代码',
        recommendation: '提取公共函数',
        duplicates,
        fixable: false
      });
    }

    // 3. 检查长函数
    const longFunctions = this.findLongFunctions(lines);
    if (longFunctions.length > 0) {
      suggestions.push({
        type: 'refactor',
        severity: 'medium',
        file: filePath,
        description: `发现 ${longFunctions.length} 个过长函数`,
        recommendation: '拆分为更小的函数',
        fixable: false
      });
    }

    // 4. 检查控制台日志
    const consoleLogs = lines
      .map((line, i) => ({ line: i + 1, text: line }))
      .filter(l => /console\.(log|warn|error)/.test(l.text));

    if (consoleLogs.length > 3) {
      suggestions.push({
        type: 'cleanup',
        severity: 'low',
        file: filePath,
        description: `发现 ${consoleLogs.length} 个console.log`,
        recommendation: '考虑移除或使用日志系统',
        fixable: true,
        autoFix: () => this.removeConsoleLogs(filePath)
      });
    }

    // 5. 检查未使用的变量
    const unusedVars = this.findUnusedVars(content);
    if (unusedVars.length > 0) {
      suggestions.push({
        type: 'cleanup',
        severity: 'low',
        file: filePath,
        description: `发现 ${unusedVars.length} 个未使用变量`,
        recommendation: '移除未使用的变量',
        fixable: false
      });
    }

    return {
      file: filePath,
      totalLines: lines.length,
      suggestions,
      score: this.calculateScore(lines.length, suggestions)
    };
  }

  /**
   * 查找重复代码
   */
  findDuplicates(lines) {
    const chunks = [];
    const duplicates = [];

    // 简单重复检测
    for (let i = 0; i < lines.length - 3; i++) {
      const chunk = lines[i].trim();
      if (chunk.length > 10 && !chunk.startsWith('//')) {
        for (let j = i + 1; j < lines.length - 3; j++) {
          if (lines[j].trim() === chunk) {
            duplicates.push({
              line1: i + 1,
              line2: j + 1
            });
          }
        }
      }
    }

    return duplicates.slice(0, 5); // 最多返回5个
  }

  /**
   * 查找过长函数
   */
  findLongFunctions(lines) {
    const longFunctions = [];
    let inFunction = false;
    let braceCount = 0;
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/function\s+\w+|const\s+\w+\s*=\s*\(|=>/.test(line)) {
        inFunction = true;
        braceCount = 0;
        startLine = i + 1;
      }

      if (inFunction) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        if (braceCount === 0 && inFunction) {
          inFunction = false;
          const linesInFunction = i - startLine + 1;
          if (linesInFunction > 50) {
            longFunctions.push({
              line: startLine,
              lines: linesInFunction
            });
          }
        }
      }
    }

    return longFunctions;
  }

  /**
   * 查找未使用变量 (简化版)
   */
  findUnusedVars(content) {
    const unused = [];
    
    // 匹配变量声明
    const varDeclares = content.match(/(?:const|let|var)\s+(\w+)/g) || [];
    const usedVars = content.match(/function\s+\w+|\b\w+\(/g) || [];
    
    for (const decl of varDeclares) {
      const varName = decl.split(/\s+/)[1];
      if (!usedVars.includes(varName)) {
        unused.push(varName);
      }
    }

    return unused.slice(0, 5);
  }

  /**
   * 移除console.log
   */
  removeConsoleLogs(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let removed = 0;

    const newLines = lines.map(line => {
      if (/console\.(log|warn|error|info)/.test(line) && !line.includes('//')) {
        removed++;
        return line.replace(/console\.(log|warn|error|info)\([^)]+\);?/g, '// 已移除');
      }
      return line;
    });

    fs.writeFileSync(filePath, newLines.join('\n'));
    
    return { removed, file: filePath };
  }

  /**
   * 计算代码质量分数
   */
  calculateScore(totalLines, suggestions) {
    let score = 100;
    
    for (const s of suggestions) {
      if (s.severity === 'high') score -= 15;
      else if (s.severity === 'medium') score -= 10;
      else if (s.severity === 'low') score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 分析整个项目
   */
  async analyzeProject() {
    console.log('🔍 分析项目代码...\n');

    const results = {
      files: [],
      totalScore: 0,
      totalSuggestions: 0,
      criticalIssues: []
    };

    // 查找所有JS文件
    const jsFiles = this.findJsFiles('.');

    for (const file of jsFiles) {
      const analysis = await this.analyzeCode(file);
      results.files.push(analysis);
      results.totalSuggestions += analysis.suggestions?.length || 0;

      // 收集关键问题
      if (analysis.suggestions) {
        results.criticalIssues.push(...analysis.suggestions.filter(s => s.severity === 'high'));
      }
    }

    // 计算平均分数
    results.totalScore = results.files.length > 0
      ? Math.round(results.files.reduce((sum, f) => sum + f.score, 0) / results.files.length)
      : 100;

    return results;
  }

  /**
   * 递归查找JS文件
   */
  findJsFiles(dir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // 跳过忽略的目录
        if (this.config.ignoredPatterns.some(p => entry.name.includes(p))) {
          continue;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
          files.push(fullPath);
        } else if (entry.isDirectory()) {
          files.push(...this.findJsFiles(fullPath));
        }
      }
    } catch {
      // 忽略访问错误
    }

    return files;
  }

  /**
   * 应用优化建议
   */
  async applySuggestion(suggestion) {
    console.log(`⚡ 应用优化: ${suggestion.description}`);

    if (suggestion.autoFix && typeof suggestion.autoFix === 'function') {
      const result = suggestion.autoFix();
      
      // 记录到历史
      if (this.history) {
        this.history.add({
          type: suggestion.type,
          description: suggestion.description,
          file: suggestion.file,
          impact: suggestion.severity === 'high' ? 'high' : 'medium'
        });
      }

      console.log('✅ 已自动修复');
      return { success: true, ...result };
    }

    console.log('⚠️ 该优化需要手动处理');
    return { success: false, suggestion };
  }

  /**
   * 自动应用所有可修复的优化
   */
  async autoFixAll() {
    console.log('🚀 开始自动优化...\n');

    const projectAnalysis = await this.analyzeProject();
    let fixedCount = 0;

    for (const file of projectAnalysis.files) {
      if (file.suggestions) {
        for (const suggestion of file.suggestions) {
          if (suggestion.fixable && fixedCount < this.config.maxOptimizations) {
            const result = await this.applySuggestion(suggestion);
            if (result.success) {
              fixedCount++;
            }
          }
        }
      }
    }

    console.log(`\n✅ 自动优化完成: ${fixedCount} 个问题已修复`);

    // 更新配置
    this.config.successfulOptimizations = (this.config.successfulOptimizations || 0) + fixedCount;
    this.config.lastAutoFix = new Date().toISOString();
    this.saveConfig();

    return { fixed: fixedCount };
  }

  /**
   * 生成优化建议报告
   */
  async generateReport() {
    const projectAnalysis = await this.analyzeProject();

    const report = {
      title: '康仔代码优化报告',
      generatedAt: new Date().toISOString(),
      summary: {
        totalFiles: projectAnalysis.files.length,
        totalScore: projectAnalysis.totalScore,
        totalSuggestions: projectAnalysis.totalSuggestions,
        criticalIssues: projectAnalysis.criticalIssues.length,
        fixableIssues: projectAnalysis.files.reduce((sum, f) => 
          sum + (f.suggestions?.filter(s => s.fixable).length || 0), 0
        )
      },
      files: projectAnalysis.files.map(f => ({
        file: f.file,
        score: f.score,
        suggestions: f.suggestions?.length || 0,
        critical: f.suggestions?.filter(s => s.severity === 'high').length || 0
      })),
      recommendations: this.generateRecommendations(projectAnalysis)
    };

    return report;
  }

  /**
   * 生成优化建议
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.totalScore < 70) {
      recommendations.push({
        priority: 'high',
        title: '提高代码质量分数',
        description: `当前分数 ${analysis.totalScore}，建议重点关注代码质量`
      });
    }

    if (analysis.criticalIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: '修复关键问题',
        description: `发现 ${analysis.criticalIssues.length} 个高优先级问题需要处理`
      });
    }

    if (analysis.totalSuggestions > 20) {
      recommendations.push({
        priority: 'medium',
        title: '减少代码异味',
        description: `发现 ${analysis.totalSuggestions} 个改进建议`
      });
    }

    return recommendations;
  }
}

// CLI工具
class AutoOptimizerCLI {
  constructor() {
    this.optimizer = new AutoOptimizer();
  }

  async run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'analyze':
        return this.analyze(args.slice(1));
      case 'fix':
        return this.fix(args.slice(1));
      case 'report':
        return this.report(args.slice(1));
      case 'config':
        return this.config(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
⚡ Auto Optimizer - 自动优化采纳

用法: auto-optimizer <command> [options]

命令:
  analyze [file]    分析代码质量
  fix               自动修复可优化项
  report            生成优化报告
  config [key val]  查看/设置配置

示例:
  auto-optimizer analyze
  auto-optimizer fix
  auto-optimizer report > optimization_report.md
  auto-optimizer config autoApply true
`;
  }

  async analyze(args) {
    const file = args[0];
    
    if (file) {
      const result = await this.optimizer.analyzeCode(file);
      console.log('\n分析结果:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const result = await this.optimizer.analyzeProject();
      console.log('\n项目分析结果:');
      console.log(`文件数: ${result.files.length}`);
      console.log(`平均分数: ${result.totalScore}`);
      console.log(`总建议: ${result.totalSuggestions}`);
    }
  }

  async fix(args) {
    const result = await this.optimizer.autoFixAll();
    console.log('\n修复结果:', result);
  }

  async report(args) {
    const report = await this.optimizer.generateReport();
    console.log(JSON.stringify(report, null, 2));
  }

  async config(args) {
    const [key, value] = args;
    
    if (key && value) {
      this.optimizer.config[key] = value === 'true' ? true : value === 'false' ? false : value;
      this.optimizer.saveConfig();
      console.log(`✅ 配置已更新: ${key}=${value}`);
    } else {
      console.log('\n当前配置:');
      console.log(JSON.stringify(this.optimizer.config, null, 2));
    }
  }
}

module.exports = { AutoOptimizer, AutoOptimizerCLI };

// 测试
async function test() {
  console.log('⚡ Auto Optimizer 测试\n');

  const optimizer = new AutoOptimizer();

  // 测试分析
  console.log('1. 分析项目');
  const result = await optimizer.analyzeProject();
  console.log(`   文件: ${result.files.length}`);
  console.log(`   分数: ${result.totalScore}`);
  console.log(`   建议: ${result.totalSuggestions}`);

  // 测试自动修复
  console.log('\n2. 自动修复');
  const fixResult = await optimizer.autoFixAll();
  console.log(`   修复: ${fixResult.fixed}个`);

  // 测试报告
  console.log('\n3. 生成报告');
  const report = await optimizer.generateReport();
  console.log(`   报告已生成: ${report.title}`);

  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new AutoOptimizerCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
