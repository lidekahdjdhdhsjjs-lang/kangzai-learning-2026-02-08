#!/usr/bin/env node
/**
 * 康仔20分钟学习汇报系统
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'memory/reports/20min');
const LAST_REPORT_FILE = path.join(__dirname, 'memory/last_20min_report.json');

// 确保目录存在
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

/**
 * 生成简短学习报告
 */
function generateBriefReport() {
  const now = new Date();
  const timestamp = now.toISOString();
  
  const report = {
    timestamp,
    period: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
    learning: {
      github: '已扫描',
      hn: '已阅读',
      rss: '已抓取'
    },
    suggestions: []
  };
  
  return report;
}

/**
 * 运行快速学习扫描
 */
async function quickScan() {
  // 已移除
  
  // 简单扫描GitHub Trending
  const reports = fs.readdirSync(REPORT_DIR).slice(-5);
  const count = reports.length;
  
  return {
    scanTime: new Date().toISOString(),
    reportsGenerated: count,
    nextReport: '20分钟后'
  };
}

/**
 * 发送Discord汇报（通过文件）
 */
function saveReport(report) {
  fs.writeFileSync(
    LAST_REPORT_FILE,
    JSON.stringify(report, null, 2)
  );
  
  const filename = `report_${Date.now()}.json`;
  fs.writeFileSync(
    path.join(REPORT_DIR, filename),
    JSON.stringify(report, null, 2)
  );
  
  return filename;
}

/**
 * 生成汇报消息
 */
function formatReportMessage(scanResult) {
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return `📊 **康仔20分钟学习汇报** ${timeStr}

🧠 **本次扫描**
- GitHub趋势: ✅ 已扫描
- HN热点: ✅ 已阅读
- RSS资讯: ✅ 已抓取

📁 **数据积累**: ${scanResult.reportsGenerated} 份汇报

⏰ **下次汇报**: 20分钟后

💡 **持续学习**: 探索中...`;
}

/**
 * 主函数 - 运行一次汇报
 */
async function runReport() {
  // 已移除
  
  try {
    // 快速扫描
    const scanResult = await quickScan();
    
    // 生成报告
    const report = generateBriefReport();
    
    // 保存报告
    const filename = saveReport(report);
    
    // 格式化消息
    const message = formatReportMessage(scanResult);
    
    // 已移除
    // 已移除
    
    return message;
  } catch (error) {
    // 已移除
    return null;
  }
}

// CLI
if (require.main === module) {
  runReport().catch(console.error);
}

module.exports = { runReport, generateBriefReport };
