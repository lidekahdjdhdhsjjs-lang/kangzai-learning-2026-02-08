#!/usr/bin/env node
/**
 * 康仔记忆系统 - 简单向量检索 v6 (优化中文分词)
 */

const path = require('path');
const fs = require('fs');

// 提取关键词 - 优化版
function extractKeywords(text) {
  const stopWords = new Set([
    '的', '是', '了', '在', '和', '与', '或', '等', '这', '那', '有', '没有', '不', '也', '都',
    '就', '要', '会', '可以', '能够', '于', '把', '被', '为', '以', '之', '其', '但', '却',
    '我们', '你们', '他们', '自己', '什么', '怎么',
    '致力于', '实现', '支持', '使用', '目标', '响应', '时间', '小于',
    'the', 'is', 'a', 'of', 'and', 'to', 'in', 'that', 'it', 'for', 'with'
  ]);
  
  const words = [];
  const textLower = text.toLowerCase();
  
  // 提取英文单词
  const englishWords = textLower.match(/[a-z]+/g) || [];
  words.push(...englishWords.filter(w => w.length >= 2 && !stopWords.has(w)));
  
  // 提取中文2-4字词
  const chineseText = text.replace(/[a-z0-9\s]/gi, '');
  for (let i = 0; i < chineseText.length - 1; i++) {
    // 2字词
    let w2 = chineseText.substring(i, i + 2);
    if (!stopWords.has(w2) && w2.length === 2) words.push(w2);
    // 3字词（重叠）
    if (i + 3 <= chineseText.length) {
      let w3 = chineseText.substring(i, i + 3);
      if (!stopWords.has(w3) && !words.includes(w3)) words.push(w3);
    }
    // 4字词
    if (i + 4 <= chineseText.length) {
      let w4 = chineseText.substring(i, i + 4);
      if (!stopWords.has(w4) && !words.includes(w4)) words.push(w4);
    }
  }
  
  return [...new Set(words)];
}

function jaccardSimilarity(k1, k2) {
  const s1 = new Set(k1), s2 = new Set(k2);
  if (!s1.size || !s2.size) return 0;
  const inter = [...s1].filter(x => s2.has(x)).length;
  const union = new Set([...s1, ...s2]).size;
  return union ? inter / union : 0;
}

class KangzaiMemorySimple {
  constructor() {
    this.memories = [];
    this.storageFile = path.join(__dirname, 'memory/simple_memory.json');
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.storageFile)) {
        this.memories = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        console.log(`✅ 已加载 ${this.memories.length} 条记忆`);
      }
    } catch {
      console.log('📝 新建记忆库');
      this.memories = [];
    }
  }

  save() {
    fs.writeFileSync(this.storageFile, JSON.stringify(this.memories, null, 2));
  }

  async addMemory(id, content, metadata = {}) {
    const memory = {
      id, content,
      metadata: { ...metadata, createdAt: new Date().toISOString() },
      keywords: extractKeywords(content)
    };
    this.memories.push(memory);
    this.save();
    return true;
  }

  async search(query, n = 5) {
    const start = Date.now();
    const qk = extractKeywords(query);
    
    const scored = this.memories
      .map(m => ({ ...m, score: jaccardSimilarity(qk, m.keywords) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .filter(r => r.score > 0);

    return {
      query, qk,
      results: scored.map(r => ({ id: r.id, content: r.content, score: Math.round(r.score*100)/100 })),
      duration: Date.now() - start,
      success: true
    };
  }

  async getStats() {
    return { total: this.memories.length };
  }
}

// 测试
async function main() {
  console.log('🚀 康仔记忆 v6.0 测试\n');
  
  // 分词测试
  console.log('分词测试:');
  console.log('  数字生命:', extractKeywords('数字生命'));
  console.log('  秒级记忆检索:', extractKeywords('秒级记忆检索'));
  console.log('  康仔是数字生命:', extractKeywords('康仔是数字生命'));
  
  const mem = new KangzaiMemorySimple();
  mem.memories = [];

  console.log('\n📝 添加记忆:');
  await mem.addMemory('t1', '康仔是数字生命致力于秒级记忆检索', { type: 'identity' });
  await mem.addMemory('t2', '秒级记忆检索目标响应时间小于10毫秒', { type: 'goal' });
  await mem.addMemory('t3', '康仔使用ChromaDB向量数据库', { type: 'tech' });
  await mem.addMemory('t4', 'Bing搜索支持双引擎DuckDuckGo', { type: 'skill' });

  console.log('\n🔍 搜索测试:');
  console.log(await mem.search('数字生命'));
  console.log(await mem.search('检索'));
  console.log(await mem.search('ChromaDB'));
  console.log(await mem.search('搜索引擎'));

  console.log('\n✅ 完成');
}

module.exports = { KangzaiMemorySimple, extractKeywords };

if (require.main === module) main().catch(console.error);
