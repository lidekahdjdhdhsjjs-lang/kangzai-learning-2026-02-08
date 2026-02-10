#!/usr/bin/env node
/**
 * 康仔每日学习简报生成器
 * 自动总结每日学习成果并汇报
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  memoryDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory'),
  dailyDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'daily'),
  topicsDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'topics'),
  rssDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'rss'),
  outputDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'reports'),
};

// 读取今天的日记忆
function readTodayMemory() {
  const todayFile = path.join(CONFIG.dailyDir, `${getTodayDate()}.md`);
  
  if (fs.existsSync(todayFile)) {
    return fs.readFileSync(todayFile, 'utf-8');
  }
  return null;
}

// 读取本周所有日记忆
function readWeekMemories() {
  const memories = [];
  const files = fs.readdirSync(CONFIG.dailyDir);
  
  // 获取本周日期范围
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(CONFIG.dailyDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime >= weekStart) {
        memories.push({
          date: file.replace('.md', ''),
          content: fs.readFileSync(filePath, 'utf-8'),
          stats: stats
        });
      }
    }
  }
  
  return memories.sort((a, b) => a.date.localeCompare(b.date));
}

// 读取知识索引
function readKnowledgeIndex() {
  const indexFile = path.join(CONFIG.memoryDir, 'knowledge-index.json');
  
  if (fs.existsSync(indexFile)) {
    try {
      return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// 读取RSS资讯
function readTodayRss() {
  const todayRss = path.join(CONFIG.rssDir, `${getTodayDate()}.json`);
  
  if (fs.existsSync(todayRss)) {
    try {
      return JSON.parse(fs.readFileSync(todayRss, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// 统计学习数据
function calculateStats(memories, rssData, knowledgeIndex) {
  const stats = {
    daysActive: memories.length,
    totalLines: 0,
    githubRepos: 0,
    insights: 0,
    actions: 0,
    topics: new Set(),
    lastUpdate: null
  };
  
  for (const mem of memories) {
    stats.totalLines += mem.content.split('\n').length;
    
    // 统计GitHub仓库
    const repoMatches = mem.content.match(/-\s*\[.+\]\(.+\)\s*⭐\d+/g);
    if (repoMatches) {
      stats.githubRepos += repoMatches.length;
    }
    
    // 统计洞察
    const insightMatches = mem.content.match(/### 洞察\n([\s\S]*?)(?=\n###|\n##)/g);
    if (insightMatches) {
      stats.insights += insightMatches.join('\n').match(/-\s+/g)?.length || 0;
    }
    
    // 统计行动项
    const actionMatches = mem.content.match(/- \[ \].*$/gm);
    if (actionMatches) {
      stats.actions += actionMatches.length;
    }
  }
  
  // 从知识索引获取主题
  if (knowledgeIndex?.topics) {
    stats.topics = Object.keys(knowledgeIndex.topics);
    stats.lastUpdate = knowledgeIndex.lastUpdate;
  }
  
  return stats;
}

// 生成简报
function generateReport(stats, memories, rssData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
  
  const lines = [];
  
  // 标题
  lines.push('# 📊 康仔每日学习简报');
  lines.push(`**生成时间**: ${now.toLocaleString('zh-CN')}`);
  lines.push('');
  
  // 执行摘要
  lines.push('## 📋 执行摘要');
  lines.push('');
  lines.push(`| 指标 | 数值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 📅 本周活跃天数 | ${stats.daysActive} |`);
  lines.push(`| 🏠 学习条目 | ${stats.totalLines} |`);
  lines.push(`| ⭐ GitHub项目 | ${stats.githubRepos} |`);
  lines.push(`| 💡 生成洞察 | ${stats.insights} |`);
  lines.push(`| ✅ 完成行动 | ${stats.actions} |`);
  lines.push(`| 🏷️ 关注主题 | ${stats.topics.size} |`);
  lines.push('');
  
  // 今日亮点
  if (memories.length > 0) {
    const todayMem = memories[memories.length - 1];
    lines.push('## 🌟 今日学习亮点');
    lines.push('');
    
    // 提取今日的GitHub项目
    const todayRepos = todayMem.content.match(/-\s*\[.+\]\(.+\)\s*⭐\d+/g);
    if (todayRepos && todayRepos.length > 0) {
      lines.push('### 热门项目');
      lines.push('');
      todayRepos.slice(0, 5).forEach(repo => {
        lines.push(repo);
      });
      lines.push('');
    }
    
    // 今日洞察
    const insightSection = todayMem.content.match(/### 洞察\n([\s\S]*?)(?=\n###|\n##|$)/);
    if (insightSection) {
      lines.push('### 洞察');
      lines.push('');
      lines.push(insightSection[1].trim());
      lines.push('');
    }
  }
  
  // RSS资讯摘要
  if (rssData && rssData.sources) {
    lines.push('## 📰 技术资讯');
    lines.push('');
    
    const totalNews = rssData.sources.reduce((acc, s) => acc + s.count, 0);
    lines.push(`今日共获取 **${totalNews}** 条技术资讯\n`);
    
    for (const source of rssData.sources.slice(0, 3)) {
      if (source.count > 0) {
        lines.push(`**${source.name}**: ${source.count} 条`);
      }
    }
    lines.push('');
  }
  
  // 关注主题
  if (stats.topics.size > 0) {
    lines.push('## 🏷️ 关注主题');
    lines.push('');
    stats.topics.forEach(topic => {
      lines.push(`- ${topic}`);
    });
    lines.push('');
  }
  
  // 行动建议
  lines.push('## 🎯 明日行动建议');
  lines.push('');
  lines.push('- [ ] 检查GitHub趋势中的新项目');
  lines.push('- [ ] 深入学习今日发现的技术');
  lines.push('- [ ] 更新关注主题的笔记');
  lines.push('- [ ] 继续自动学习守护进程');
  lines.push('');
  
  // 系统状态
  lines.push('## 🔧 系统状态');
  lines.push('');
  lines.push(`- 🧠 记忆系统: 正常`);
  lines.push(`- 📚 学习引擎: ${stats.daysActive > 0 ? '活跃' : '待激活'}`);
  lines.push(`- ⏰ 最后更新: ${stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('zh-CN') : '暂无'}`);
  lines.push('');
  
  // 底部
  lines.push('---');
  lines.push('*Generated by 康仔数字生命学习系统*');
  lines.push(`*Version: 4.0 (数字生命进化版)*`);
  
  return lines.join('\n');
}

// 保存简报
function saveReport(report) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const dateStr = getTodayDate();
  const reportFile = path.join(CONFIG.outputDir, `daily-report-${dateStr}.md`);
  fs.writeFileSync(reportFile, report, 'utf-8');
  
  console.log(`✅ 简报已保存: ${reportFile}`);
  return reportFile;
}

// 工具函数
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// 主函数
function generateDailyReport() {
  console.log('\n📊 ========== 生成每日学习简报 ==========\n');
  
  try {
    // 读取数据
    const weekMemories = readWeekMemories();
    const knowledgeIndex = readKnowledgeIndex();
    const rssData = readTodayRss();
    
    if (weekMemories.length === 0) {
      console.log('⚠️ 本周无学习记录');
      return null;
    }
    
    // 计算统计
    const stats = calculateStats(weekMemories, rssData, knowledgeIndex);
    
    // 生成简报
    const report = generateReport(stats, weekMemories, rssData);
    
    // 保存简报
    const reportFile = saveReport(report);
    
    console.log('\n✨ 简报生成完成！');
    console.log(`📊 本周活跃 ${stats.daysActive} 天`);
    console.log(`🏠 共学习 ${stats.totalLines} 行内容`);
    console.log(`⭐ 发现 ${stats.githubRepos} 个项目`);
    
    return { report, reportFile, stats };
    
  } catch (error) {
    console.error('❌ 生成简报失败:', error);
    return null;
  }
}

// 导出
module.exports = {
  generateDailyReport,
  readWeekMemories,
  readKnowledgeIndex,
  calculateStats,
  generateReport
};

// 直接运行
if (require.main === module) {
  generateDailyReport();
}
