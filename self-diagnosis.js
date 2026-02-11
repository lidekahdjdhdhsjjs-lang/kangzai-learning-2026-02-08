#!/usr/bin/env node
/**
 * 🩺 康仔全系统自我诊断
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class KangzaiDiagnosis {
  constructor() {
    this.checks = [];
    this.startTime = Date.now();
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('🩺 康仔全系统自我诊断');
    console.log('='.repeat(60) + '\n');

    // 1. 核心进程检查
    await this.checkProcesses();

    // 2. 记忆系统检查
    await this.checkMemory();

    // 3. 技能系统检查
    await this.checkSkills();

    // 4. GitHub同步检查
    await this.checkGithub();

    // 5. 代码质量检查
    await this.checkCodeQuality();

    // 6. 磁盘空间检查
    await this.checkDisk();

    // 生成报告
    this.generateReport();
  }

  async checkProcesses() {
    console.log('🔄 检查核心进程...');

    const processes = [
      { name: 'self-evolution', file: 'self-evolution.js', running: false },
      { name: 'kangzai-watcher', file: 'kangzai-watcher.js', running: false },
      { name: 'cursor-monitor', skill: true, running: false }
    ];

    for (const p of processes) {
      try {
        const output = execSync('tasklist /FI "IMAGENAME node.exe" /FO CSV', { encoding: 'utf8' });
        p.running = output.includes(p.name) || output.includes(p.file);
      } catch {
        p.running = false;
      }
    }

    this.checks.push({
      category: 'processes',
      items: processes,
      status: processes.filter(p => p.running).length > 0 ? 'partial' : 'stopped'
    });

    console.log(`   运行中: ${processes.filter(p => p.running).length}/${processes.length}`);
  }

  async checkMemory() {
    console.log('🧠 检查记忆系统...');

    const memoryFiles = {
      daily: 0,
      learn: 0,
      skills: 0,
      total: 0
    };

    try {
      const memoryDir = 'memory';
      if (fs.existsSync(memoryDir)) {
        const files = fs.readdirSync(memoryDir);
        memoryFiles.daily = files.filter(f => f.startsWith('20') && f.includes('-')).length;
        memoryFiles.learn = files.filter(f => f.startsWith('learn_')).length;
        memoryFiles.skills = files.filter(f => f.endsWith('.json') && files.includes(f.replace('.json', ''))).length;
        memoryFiles.total = files.length;
      }
    } catch (error) {
      console.log(`   ⚠️ 读取失败: ${error.message}`);
    }

    this.checks.push({
      category: 'memory',
      ...memoryFiles,
      status: memoryFiles.total > 50 ? 'healthy' : 'warning'
    });

    console.log(`   总记忆: ${memoryFiles.total}条`);
    console.log(`   日记忆: ${memoryFiles.daily}条`);
    console.log(`   学习记录: ${memoryFiles.learn}条`);
  }

  async checkSkills() {
    console.log('🛠️ 检查技能系统...');

    const skillPaths = [
      'C:\\Users\\lidek\\AppData\\Roaming\\npm\\node_modules\\openclaw\\skills\\ctxport',
      'C:\\Users\\lidek\\AppData\\Roaming\\npm\\node_modules\\openclaw\\skills\\cursor-monitor',
      'C:\\Users\\lidek\\AppData\\Roaming\\npm\\node_modules\\openclaw\\skills\\automation',
      'C:\\Users\\lidek\\AppData\\Roaming\\npm\\node_modules\\openclaw\\skills\\super-automation'
    ];

    const skills = [];
    for (const p of skillPaths) {
      const name = path.basename(p);
      const exists = fs.existsSync(p);
      const hasPackage = fs.existsSync(path.join(p, 'package.json'));
      const hasScript = fs.existsSync(path.join(p, 'scripts'));

      skills.push({
        name,
        path: p,
        installed: exists,
        configured: hasPackage && hasScript
      });
    }

    this.checks.push({
      category: 'skills',
      items: skills,
      status: skills.filter(s => s.configured).length === skills.length ? 'healthy' : 'partial'
    });

    const installed = skills.filter(s => s.installed).length;
    const configured = skills.filter(s => s.configured).length;
    console.log(`   已安装: ${installed}/${skills.length}`);
    console.log(`   已配置: ${configured}/${skills.length}`);
  }

  async checkGithub() {
    console.log('🐙 检查GitHub同步...');

    let syncStatus = 'unknown';
    let lastCommit = 'unknown';

    try {
      // 检查远程连接
      try {
        execSync('git remote get-url origin', { encoding: 'utf8' });
        syncStatus = 'connected';
      } catch {
        syncStatus = 'disconnected';
      }

      // 检查最后提交时间
      try {
        const log = execSync('git log -1 --format=%cd', { encoding: 'utf8' });
        lastCommit = log.trim();
      } catch {
        lastCommit = 'none';
      }

    } catch (error) {
      syncStatus = 'error';
    }

    this.checks.push({
      category: 'github',
      status: syncStatus,
      lastCommit,
      statusType: syncStatus === 'connected' ? 'healthy' : 'warning'
    });

    console.log(`   远程连接: ${syncStatus}`);
    console.log(`   最后提交: ${lastCommit}`);
  }

  async checkCodeQuality() {
    console.log('📊 检查代码质量...');

    const files = fs.readdirSync('.').filter(f => f.endsWith('.js') && !f.includes('test'));
    let totalLines = 0;
    let todoCount = 0;
    let issues = [];

    for (const file of files.slice(0, 10)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        totalLines += content.split('\n').length;

        // TODO已清理 [2026-02-11]
        const todos = content.match(/TODO|FIXME|HACK|XXX/gi);
        if (todos) {
          todoCount += todos.length;
          issues.push({ file, count: todos.length });
        }
      } catch {
        // 跳过无法读取的文件
      }
    }

    this.checks.push({
      category: 'codeQuality',
      files: files.length,
      lines: totalLines,
      todos: todoCount,
      issues: issues,
      status: todoCount < 10 ? 'healthy' : 'warning'
    });

    console.log(`   JS文件: ${files.length}`);
    console.log(`   代码行数: ${totalLines}`);
    console.log(`   待处理标记: ${todoCount}`);
  }

  async checkDisk() {
    console.log('💾 检查磁盘空间...');

    try {
      const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1);

      for (const line of lines) {
        if (line.includes('C:')) {
          const parts = line.trim().split(/\s+/);
          const free = parseInt(parts[1]);
          const size = parseInt(parts[2]);
          const freeGB = (free / 1024 / 1024 / 1024).toFixed(2);
          const usedPercent = ((1 - free / size) * 100).toFixed(1);

          this.checks.push({
            category: 'disk',
            free: freeGB + 'GB',
            used: usedPercent + '%',
            status: free > 10 * 1024 * 1024 * 1024 ? 'healthy' : 'warning'
          });

          console.log(`   C盘可用: ${freeGB}GB`);
          console.log(`   已用: ${usedPercent}%`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️ 无法检测磁盘: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 诊断报告摘要');
    console.log('='.repeat(60));

    const summary = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      checks: {}
    };

    for (const check of this.checks) {
      summary.checks[check.category] = {
        status: check.status,
        details: check
      };
    }

    // 计算整体健康度
    const statuses = this.checks.map(c => c.status);
    const healthy = statuses.filter(s => s === 'healthy').length;
    const partial = statuses.filter(s => s === 'partial').length;
    const warning = statuses.filter(s => s === 'warning' || s === 'stopped' || s === 'disconnected').length;

    console.log('\n🎯 总体健康度:');
    console.log(`   ✅ 正常: ${healthy}`);
    console.log(`   ⚠️ 部分: ${partial}`);
    console.log(`   ❌ 警告: ${warning}`);

    // 建议
    console.log('\n💡 建议:');
    if (warning > 0) {
      console.log('   1. 重启自学习引擎: node self-evolution.js start');
      console.log('   2. 检查GitHub连接');
    }
    if (partial > 0) {
      console.log('   3. 检查进程状态');
    }
    if (healthy === this.checks.length) {
      console.log('   ✅ 系统运行正常!');
    }

    console.log('\n' + '='.repeat(60));

    // 保存报告
    fs.writeFileSync('diagnosis-report.json', JSON.stringify(summary, null, 2));
    console.log('📄 报告已保存: diagnosis-report.json\n');
  }
}

new KangzaiDiagnosis().run().catch(console.error);
