#!/usr/bin/env node
/**
 * 康仔学习守护进程 v2.2
 * 使用HTTP源替代无法访问的HTTPS API
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 配置
const CONFIG = {
  memoryDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory'),
  dailyDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'daily'),
  topicsDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'topics'),
  learnInterval: 60 * 60 * 1000,
  
  // 使用HTTP源
  sources: {
    github: {
      // GitHub Trending RSS (HTTP)
      trending: 'https://github-trending-api.pages.dev/last-week',
      // 或者使用 GitHub RSS
      rss: 'https://github.com/trending.atom'
    },
    rss: [
      { name: 'Hacker News', url: 'http://news.ycombinator.com/rss' },
      { name: 'GitHub Blog', url: 'http://github.blog/feed/' },
      { name: 'V2EX', url: 'http://v2ex.com/feed' },
      { name: 'TechCrunch', url: 'http://techcrunch.com/feed/' }
    ]
  },
  
  topics: ['AI', 'Machine Learning', 'TypeScript', 'OpenClaw', 'LLM']
};

// 加载配置
function loadConfig() {
  const configFile = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'kangzai', 'evolution-config.json');
  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      if (config.learning?.topics) CONFIG.topics = config.learning.topics;
    } catch (e) {}
  }
}

// HTTP请求
function httpGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(10000, () => { req.destroy(); resolve(''); });
    req.end();
  });
}

// 解析GitHub Trending
async function fetchGitHubTrending() {
  console.log('📊 抓取GitHub Trending...');
  const results = [];
  
  // 使用GitHub Trending API (HTTP)
  try {
    const data = await httpGet('https://github-trending-api.pages.dev/last-week');
    if (data.startsWith('[')) {
      const repos = JSON.parse(data);
      repos.slice(0, 15).forEach(r => {
        results.push({
          name: r.fullName,
          stars: r.stars,
          description: r.description,
          url: r.url,
          language: r.language,
          timestamp: new Date().toISOString()
        });
      });
      console.log(`  ✓ 获取 ${results.length} 个Trending仓库`);
    }
  } catch (e) {
    console.log(`  ✗ GitHub Trending API失败: ${e.message}`);
  }
  
  // 备用: 直接抓取GitHub Trending页面
  if (results.length === 0) {
    console.log('  🔄 尝试备用方案...');
    try {
      const html = await httpGet('https://github.com/trending?since=weekly');
      // 简单解析
      console.log('  ⚠️ 页面抓取完成，需HTML解析器');
    } catch (e) {}
  }
  
  return results;
}

// RSS抓取
async function fetchRSS() {
  console.log('📰 抓取RSS资讯...');
  const results = [];
  
  for (const feed of CONFIG.sources.rss) {
    try {
      const xml = await httpGet(feed.url);
      if (xml.length > 50) {
        const items = parseRSS(xml);
        results.push({ source: feed.name, count: items.length, items: items.slice(0, 3) });
        console.log(`  ✓ ${feed.name}: ${items.length} 条`);
      } else {
        console.log(`  ✗ ${feed.name}: 无数据`);
      }
    } catch (e) {
      console.log(`  ✗ ${feed.name}: ${e.message.slice(0, 30)}`);
    }
  }
  
  return results;
}

// 解析RSS
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const title = match[1].match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
    const link = match[1].match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || '';
    if (title && link) {
      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim().slice(0, 100),
        link: link.trim()
      });
    }
  }
  
  return items;
}

// 知识蒸馏
function distillKnowledge(githubData, rssData) {
  const knowledge = {
    timestamp: new Date().toISOString(),
    githubTrends: githubData,
    rss: rssData,
    insights: [],
    actionItems: ['检查GitHub趋势', '阅读科技资讯', '更新主题笔记']
  };
  
  if (githubData.length > 0) {
    const top = githubData.sort((a, b) => b.stars - a.stars)[0];
    knowledge.insights.push({
      title: `🔥 ${top.name}`,
      detail: `⭐${top.stars} | ${top.language || '多语言'}`
    });
  }
  
  return knowledge;
}

// 保存
function saveToMemory(knowledge) {
  console.log('💾 保存记忆...');
  
  const today = new Date().toISOString().split('T')[0];
  const todayFile = path.join(CONFIG.dailyDir, `${today}.md`);
  
  let content = fs.existsSync(todayFile) ? fs.readFileSync(todayFile, 'utf-8') : `# ${today} - 康仔学习日志\n\n`;
  
  content += `\n## 🧠 ${new Date().toLocaleString('zh-CN')} - 自动学习\n`;
  
  if (knowledge.githubTrends.length > 0) {
    content += `\n### 📊 GitHub Trending (${knowledge.githubTrends.length})\n`;
    knowledge.githubTrends.slice(0, 10).forEach(r => {
      content += `- [${r.name}](${r.url}) ⭐${r.stars}\n`;
    });
  } else {
    content += `\n### 📊 GitHub趋势\n`;
    content += `- (使用GitHub Trending API)\n`;
  }
  
  if (knowledge.insights.length > 0) {
    content += `\n### 💡 洞察\n`;
    knowledge.insights.forEach(i => content += `- **${i.title}**: ${i.detail}\n`);
  }
  
  content += `\n### ✅ 行动\n`;
  knowledge.actionItems.forEach(a => content += `- [ ] ${a}\n`);
  
  fs.writeFileSync(todayFile, content, 'utf-8');
  console.log(`  ✓ ${todayFile}`);
}

// 更新索引
function updateKnowledgeIndex(knowledge) {
  const indexFile = path.join(CONFIG.memoryDir, 'knowledge-index.json');
  let index = { topics: {}, lastUpdate: null };
  
  if (fs.existsSync(indexFile)) {
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf-8')); } catch (e) {}
  }
  
  index.lastUpdate = new Date().toISOString();
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf-8');
  console.log('  ✓ 索引已更新');
}

// 主函数
async function learn() {
  console.log('\n🚀 康仔学习守护进程 v2.2');
  console.log(`📅 ${new Date().toLocaleString('zh-CN')}`);
  
  try {
    loadConfig();
    
    const [githubData, rssData] = await Promise.all([
      fetchGitHubTrending(),
      fetchRSS()
    ]);
    
    const knowledge = distillKnowledge(githubData, rssData);
    saveToMemory(knowledge);
    updateKnowledgeIndex(knowledge);
    
    console.log('\n✨ 完成!');
    console.log(`  📊 GitHub: ${githubData.length} 仓库`);
    console.log(`  📰 RSS: ${rssData.reduce((a, b) => a + b.count, 0)} 条`);
    
  } catch (error) {
    console.error('\n❌ 失败:', error.message);
  }
}

// 初始化
function init() {
  [CONFIG.dailyDir, CONFIG.topicsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  
  const singleRun = process.argv.includes('--once');
  
  learn().then(() => {
    if (!singleRun) {
      console.log(`\n⏰ 下次学习: ${new Date(Date.now() + CONFIG.learnInterval).toLocaleString('zh-CN')}`);
      setInterval(learn, CONFIG.learnInterval);
    }
  });
}

if (require.main === module) init();
module.exports = { learn };
