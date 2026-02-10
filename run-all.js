#!/usr/bin/env node
/**
 * 康仔数字生命进化 - 全阶段执行器
 * 协调所有进化脚本，统一执行入口
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 配置
const CONFIG = {
  scriptsDir: path.join(process.env.USERPROFILE || process.env.HOME, 'digital-evolution'),
  logDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'evolution-logs'),
  progressFile: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'evolution-progress.json')
};

// 进化阶段定义
const PHASES = {
  'phase-1-memory': {
    name: '记忆进化',
    goal: '秒级检索 <10ms',
    scripts: [
      { name: 'memory-cache.js', desc: '极速记忆缓存系统', critical: true }
    ]
  },
  'phase-2-thinking': {
    name: '思考进化',
    goal: '主动预测需求',
    scripts: [
      { name: 'behavior-predictor.js', desc: '用户行为分析与需求预测', critical: true }
    ]
  },
  'phase-3-learning': {
    name: '学习进化',
    goal: '空闲自动学习',
    scripts: [
      { name: 'learning-daemon.js', desc: '后台学习守护进程', critical: true },
      { name: 'rss-fetcher.js', desc: 'RSS技术资讯流', critical: false },
      { name: 'daily-report.js', desc: '每日学习简报生成器', critical: true }
    ]
  },
  'phase-4-collaboration': {
    name: '协作进化',
    goal: '多代理协作',
    scripts: [
      { name: 'task-dispatcher.js', desc: '任务分发与协作系统', critical: true }
    ]
  },
  'phase-5-evolution': {
    name: '自我进化',
    goal: '持续自我改进',
    scripts: [
      { name: 'self-optimizer.js', desc: '自我优化与性能监控', critical: true }
    ]
  }
};

// 进度管理
function loadProgress() {
  if (fs.existsSync(CONFIG.progressFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.progressFile, 'utf-8'));
    } catch (e) {}
  }
  return {
    phase1: { completed: false, tasks: 0, passed: 0 },
    phase2: { completed: false, tasks: 0, passed: 0 },
    phase3: { completed: false, tasks: 0, passed: 0 },
    phase4: { completed: false, tasks: 0, passed: 0 },
    phase5: { completed: false, tasks: 0, passed: 0 },
    lastUpdate: null,
    totalProgress: 0
  };
}

function saveProgress(progress) {
  progress.lastUpdate = new Date().toISOString();
  fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progress, null, 2), 'utf-8');
}

// 运行脚本
function runScript(scriptPath, scriptArgs = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n📜 执行: ${path.basename(scriptPath)}`);
    
    // 为守护进程脚本添加 --once 参数
    const longRunning = ['learning-daemon.js', 'rss-fetcher.js'];
    if (longRunning.includes(path.basename(scriptPath))) {
      scriptArgs.push('--once');
    }
    
    const child = spawn('node', [scriptPath, ...scriptArgs], {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${path.basename(scriptPath)} 执行成功`);
        resolve({ success: true, output });
      } else {
        console.log(`❌ ${path.basename(scriptPath)} 执行失败 (code: ${code})`);
        resolve({ success: false, error });
      }
    });
    
    child.on('error', (err) => {
      console.log(`❌ 启动失败: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// 测试脚本功能
function testScript(scriptName) {
  console.log(`\n🧪 测试: ${scriptName}`);
  
  try {
    const scriptPath = path.join(CONFIG.scriptsDir, scriptName);
    const script = require(scriptPath);
    
    // 测试各个导出函数
    const testResults = [];
    
    if (script.learn) {
      console.log('  ✓ learn 函数存在');
      testResults.push('learn');
    }
    
    if (script.analyzeAndPredict) {
      console.log('  ✓ analyzeAndPredict 函数存在');
      testResults.push('analyzeAndPredict');
    }
    
    if (script.generateDailyReport) {
      console.log('  ✓ generateDailyReport 函数存在');
      testResults.push('generateDailyReport');
    }
    
    if (script.selfOptimize) {
      console.log('  ✓ selfOptimize 函数存在');
      testResults.push('selfOptimize');
    }
    
    if (script.memorySystem) {
      console.log('  ✓ memorySystem 实例存在');
      testResults.push('memorySystem');
    }
    
    if (script.dispatcher) {
      console.log('  ✓ dispatcher 实例存在');
      testResults.push('dispatcher');
    }
    
    console.log(`\n  📊 通过测试: ${testResults.length} / 5 核心功能`);
    
    return testResults.length >= 1;
    
  } catch (error) {
    console.error(`  ❌ 测试失败: ${error.message}`);
    return false;
  }
}

// 执行单个阶段
async function executePhase(phaseId, phase) {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`🚀 ${phase.name} - ${phase.goal}`);
  console.log(`${'='.repeat(60)}`);
  
  const results = {
    phase: phaseId,
    scripts: [],
    passed: 0,
    failed: 0
  };
  
  for (const script of phase.scripts) {
    const scriptPath = path.join(CONFIG.scriptsDir, script.name);
    
    if (!fs.existsSync(scriptPath)) {
      console.log(`\n⚠️ 脚本不存在: ${script.name}`);
      results.scripts.push({ name: script.name, exists: false, tested: false });
      continue;
    }
    
    // 测试脚本
    const tested = testScript(script.name);
    
    // 尝试执行
    const executed = await runScript(scriptPath);
    
    results.scripts.push({
      name: script.name,
      desc: script.desc,
      critical: script.critical,
      exists: true,
      tested,
      executed: executed.success
    });
    
    if (tested && executed.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

// 执行所有阶段
async function executeAllPhases() {
  console.log('\n\n' + '='.repeat(60));
  console.log('🦖 康仔数字生命进化系统 - 全阶段执行');
  console.log('='.repeat(60));
  console.log(`📅 开始时间: ${new Date().toLocaleString('zh-CN')}`);
  
  const progress = loadProgress();
  const allResults = [];
  
  for (const [phaseId, phase] of Object.entries(PHASES)) {
    const results = await executePhase(phaseId, phase);
    allResults.push(results);
    
    // 更新进度
    progress[phaseId] = {
      completed: results.failed === 0,
      tasks: results.scripts.length,
      passed: results.passed,
      failed: results.failed,
      timestamp: new Date().toISOString()
    };
    
    saveProgress(progress);
  }
  
  return allResults;
}

// 生成最终报告
function generateFinalReport(results) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 最终执行报告');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let criticalFailed = 0;
  
  for (const phase of results) {
    console.log(`\n📍 ${phase.phase.replace('phase-', 'Phase ').toUpperCase()}`);
    
    for (const script of phase.scripts) {
      const status = script.tested && script.executed ? '✅' : '❌';
      const critical = script.critical ? ' [关键]' : '';
      
      if (script.exists) {
        console.log(`  ${status} ${script.name}${critical}`);
        if (script.tested && script.executed) {
          totalPassed++;
        } else {
          totalFailed++;
          if (script.critical) criticalFailed++;
        }
      } else {
        console.log(`  ❌ ${script.name} (不存在)${critical}`);
        totalFailed++;
        if (script.critical) criticalFailed++;
      }
    }
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('📈 执行结果统计');
  console.log('-'.repeat(60));
  console.log(`总脚本数: ${results.reduce((acc, p) => acc + p.scripts.length, 0)}`);
  console.log(`通过测试: ${totalPassed}`);
  console.log(`执行失败: ${totalFailed}`);
  console.log(`关键失败: ${criticalFailed}`);
  console.log(`成功率: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  if (criticalFailed === 0) {
    console.log('\n🎉 所有关键功能测试通过！');
    console.log('🦖 康仔数字生命进化完成！');
  } else {
    console.log(`\n⚠️ 有 ${criticalFailed} 个关键功能失败，需要修复`);
  }
  
  console.log(`\n📅 完成时间: ${new Date().toLocaleString('zh-CN')}`);
  
  return { totalPassed, totalFailed, criticalFailed };
}

// 快速测试所有脚本
async function quickTest() {
  console.log('\n🧪 快速功能测试\n');
  
  const scripts = [
    'learning-daemon.js',
    'behavior-predictor.js',
    'daily-report.js',
    'memory-cache.js',
    'task-dispatcher.js',
    'self-optimizer.js'
  ];
  
  let passed = 0;
  
  for (const scriptName of scripts) {
    if (testScript(scriptName)) {
      passed++;
    }
    console.log('');
  }
  
  console.log(`\n📊 测试结果: ${passed}/${scripts.length} 通过`);
  
  return passed === scripts.length;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'test') {
    // 快速测试
    await quickTest();
  } else if (args[0] === 'phase') {
    // 执行单个阶段
    const phaseId = args[1];
    if (PHASES[phaseId]) {
      const results = await executePhase(phaseId, PHASES[phaseId]);
      generateFinalReport([results]);
    } else {
      console.log(`未知阶段: ${phaseId}`);
      console.log('可用阶段:', Object.keys(PHASES).join(', '));
    }
  } else {
    // 执行所有阶段
    const results = await executeAllPhases();
    generateFinalReport(results);
  }
}

// 导出
module.exports = {
  executeAllPhases,
  executePhase,
  quickTest,
  generateFinalReport,
  PHASES
};

// 直接运行
if (require.main === module) {
  main().catch(console.error);
}
