#!/usr/bin/env node
/**
 * 康仔持续监控模式
 * 盯着Cursor代码 + 自学习 + Skills开发
 */

const { CursorMonitor } = require('C:/Users/lidek/AppData/Roaming/npm/node_modules/openclaw/skills/cursor-monitor/scripts/cursor-monitor');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MONITOR_INTERVAL = 30000; // 30秒扫描一次
const MONITOR_DIR = 'C:\\Users\\lidek';

class KangzaiWatcher {
  constructor() {
    this.cursorMonitor = new CursorMonitor({
      watchPath: MONITOR_DIR,
      memoryPath: 'C:\\Users\\lidek\\digital-evolution\\memory-simple.js'
    });
    
    this.lastState = null;
    this.learningLog = [];
    this.skillIdeas = [];
  }

  async start() {
    console.log('\n' + '='.repeat(60));
    console.log('👁️ 康仔持续监控模式启动');
    console.log('='.repeat(60));
    console.log(`📁 监控目录: ${MONITOR_DIR}`);
    console.log(`⏰ 扫描间隔: ${MONITOR_INTERVAL / 1000}秒`);
    console.log(`🧠 模式: 代码监控 + 自动学习 + Skills开发`);
    console.log('='.repeat(60) + '\n');

    // 立即扫描一次
    await this.scan();

    // 定期扫描
    const timer = setInterval(async () => {
      await this.scan();
    }, MONITOR_INTERVAL);

    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n👋 停止监控');
      clearInterval(timer);
      this.saveLearningLog();
      process.exit(0);
    });
  }

  async scan() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN');
    
    console.log(`\n[${timeStr}] 👁️ 扫描代码变化...`);

    try {
      // 使用cursor-monitor扫描
      const result = await this.cursorMonitor.scan();
      
      // 检测变化
      const hasChanges = result.changes.new.length > 0 || result.changes.modified.length > 0;
      
      if (hasChanges) {
        console.log(`  🆕 新文件: ${result.changes.new.length}`);
        console.log(`  📝 修改: ${result.changes.modified.length}`);
        
        // 分析新技术
        await this.analyzeChanges(result.changes);
        
        // 生成学习记录
        this.logLearning(result.changes);
        
        // 思考是否需要开发新技能
        await this.thinkAboutSkills(result.changes);
      } else {
        console.log(`  ✅ 无变化，继续监控...`);
      }

      // 定期自我优化
      await this.autoOptimize();
      
    } catch (error) {
      console.log(`  ⚠️ 扫描错误: ${error.message}`);
    }
  }

  async analyzeChanges(changes) {
    const allFiles = [...changes.new, ...changes.modified];
    
    for (const file of allFiles.slice(0, 5)) {
      const analysis = this.cursorMonitor.analyzeCode(file);
      
      if (analysis.technologies.length > 0) {
        console.log(`  🔧 检测到技术: ${analysis.technologies.join(', ')}`);
      }
    }
  }

  logLearning(changes) {
    const entry = {
      time: new Date().toISOString(),
      newFiles: changes.new.length,
      modifiedFiles: changes.modified.length,
      timestamp: Date.now()
    };
    
    this.learningLog.push(entry);
    
    // 保存学习日志
    const logFile = 'memory/cursor-watcher-log.json';
    fs.writeFileSync(logFile, JSON.stringify(this.learningLog.slice(-100), null, 2));
  }

  async thinkAboutSkills(changes) {
    const keywords = ['automation', 'monitor', 'learning', 'memory', 'search', 'cursor', 'ai', 'agent'];
    
    for (const file of changes.new) {
      const lowerName = file.name.toLowerCase();
      
      for (const keyword of keywords) {
        if (lowerName.includes(keyword)) {
          console.log(`  💡 发现新方向: ${keyword}`);
          this.skillIdeas.push({
            keyword,
            file: file.relativePath,
            time: Date.now()
          });
        }
      }
    }
  }

  async autoOptimize() {
    // 定期检查是否需要优化
    if (this.learningLog.length % 10 === 0) {
      console.log(`  🧠 自我优化分析...`);
      
      // 检查学习频率
      const recent = this.learningLog.slice(-10);
      const avgInterval = recent.length > 1 
        ? (recent[recent.length-1].timestamp - recent[0].timestamp) / recent.length / 1000
        : MONITOR_INTERVAL / 1000;
      
      console.log(`  📊 平均扫描间隔: ${avgInterval.toFixed(1)}秒`);
    }
  }

  saveLearningLog() {
    const logFile = 'memory/cursor-watcher-final-log.json';
    fs.writeFileSync(logFile, JSON.stringify(this.learningLog, null, 2));
    console.log(`💾 学习日志已保存: ${this.learningLog.length} 条记录`);
  }

  // 开发新技能的入口
  async developSkill(skillName, description) {
    console.log(`\n🎯 开始开发新技能: ${skillName}`);
    
    // 这里可以集成skill-creator
    // 或者自动生成技能模板
    
    return {
      skillName,
      description,
      status: 'planned',
      createdAt: new Date().toISOString()
    };
  }
}

// 主程序
async function main() {
  const watcher = new KangzaiWatcher();
  await watcher.start();
}

main().catch(console.error);
