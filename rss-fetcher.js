#!/usr/bin/env node
/**
 * RSS技术资讯流
 * 自动抓取技术新闻和资讯
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  // RSS订阅源
  feeds: [
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com/rss',
      category: 'tech'
    },
    {
      name: 'GitHub Blog',
      url: 'https://github.blog/feed/',
      category: 'dev'
    },
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/',
      category: 'tech'
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog/rss.xml',
      category: 'AI'
    },
    {
      name: 'MIT Technology Review',
      url: 'https://www.technologyreview.com/feed/',
      category: 'tech'
    }
  ],
  
  // 输出目录
  outputDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'rss'),
  maxItemsPerFeed: 5
};

// 解析RSS/Atom
function parseFeed(xml) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const item = {
      title: extractXmlContent(itemXml, 'title'),
      link: extractXmlContent(itemXml, 'link'),
      description: extractXmlContent(itemXml, 'description') || extractXmlContent(itemXml, 'summary'),
      pubDate: extractXmlContent(itemXml, 'pubDate') || extractXmlContent(itemXml, 'published'),
      category: extractXmlContent(itemXml, 'category')
    };
    
    if (item.title && item.link) {
      items.push(item);
    }
  }
  
  return items;
}

function extractXmlContent(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '') : null;
}

// 获取RSS内容
function fetchFeed(feed) {
  return new Promise((resolve, reject) => {
    console.log(`📥 抓取 ${feed.name}...`);
    
    const req = https.get(feed.url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const items = parseFeed(data).slice(0, CONFIG.maxItemsPerFeed);
          resolve({ ...feed, items });
        } catch (error) {
          console.error(`❌ 解析 ${feed.name} 失败:`, error.message);
          resolve({ ...feed, items: [] });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ 获取 ${feed.name} 失败:`, error.message);
      resolve({ ...feed, items: [] });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ ...feed, items: [] });
    });
  });
}

// 保存RSS资讯
function saveRssNews(feeds) {
  const date = new Date().toISOString().split('T')[0];
  const outputFile = path.join(CONFIG.outputDir, `${date}.json`);
  
  const newsData = {
    timestamp: new Date().toISOString(),
    sources: feeds.map(f => ({
      name: f.name,
      category: f.category,
      count: f.items.length,
      items: f.items
    }))
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(newsData, null, 2), 'utf-8');
  console.log(`✅ RSS资讯已保存: ${outputFile}`);
  
  return newsData;
}

// 生成摘要
function generateSummary(newsData) {
  const lines = [];
  lines.push(`## 📰 ${new Date().toLocaleDateString('zh-CN')} - 技术资讯摘要\n`);
  
  for (const source of newsData.sources) {
    if (source.count > 0) {
      lines.push(`### ${source.name}\n`);
      source.items.forEach(item => {
        lines.push(`- [${item.title}](${item.link})`);
      });
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

// 主动推送给用户 (如果有Telegram等配置)
function notifyUser(summary) {
  // TODO: 实现消息推送
  console.log('📱 资讯摘要已生成（消息推送待配置）');
}

// 主函数
async function fetchAllFeeds() {
  console.log('\n📡 ========== RSS资讯抓取 ==========\n');
  
  // 确保目录存在
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // 并行抓取所有源
  const results = await Promise.all(CONFIG.feeds.map(fetchFeed));
  
  // 保存资讯
  const newsData = saveRssNews(results);
  
  // 生成摘要
  const summary = generateSummary(newsData);
  
  console.log('\n✨ RSS抓取完成！');
  console.log(`📰 共获取 ${results.reduce((acc, f) => acc + f.items.length, 0)} 条资讯`);
  
  return { newsData, summary };
}

// 导出
module.exports = {
  fetchAllFeeds,
  fetchFeed,
  saveRssNews,
  generateSummary
};

// 直接运行
if (require.main === module) {
  fetchAllFeeds().catch(console.error);
}
