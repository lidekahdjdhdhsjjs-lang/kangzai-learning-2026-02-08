#!/usr/bin/env node
/**
 * 康仔极速记忆缓存系统
 * LRU缓存 + 索引优化，目标 <10ms 检索
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置
const CONFIG = {
  cacheDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'cache'),
  indexDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'index'),
  memoryDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory'),
  
  // LRU缓存配置
  maxCacheSize: 1000,        // 最大缓存条目
  maxCacheAge: 24 * 60 * 60 * 1000, // 24小时过期
  
  // 检索配置
  defaultLimit: 20,
  maxResultLimit: 100
};

// 缓存条目结构
class CacheEntry {
  constructor(key, value, metadata = {}) {
    this.key = key;
    this.value = value;
    this.metadata = metadata;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 0;
  }
  
  access() {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }
}

// LRU缓存管理器
class LRUCache {
  constructor(maxSize = 1000, maxAge = 86400000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
    this.cache = new Map();
    this.metadataFile = path.join(CONFIG.cacheDir, 'lru-metadata.json');
    this.load();
  }
  
  load() {
    if (fs.existsSync(this.metadataFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.metadataFile, 'utf-8'));
        this.cache = new Map(Object.entries(data.cache || {}));
      } catch (e) {
        this.cache = new Map();
      }
    }
  }
  
  save() {
    if (!fs.existsSync(CONFIG.cacheDir)) {
      fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
    }
    const data = {
      cache: Object.fromEntries(this.cache),
      lastSave: Date.now()
    };
    fs.writeFileSync(this.metadataFile, JSON.stringify(data, null, 2), 'utf-8');
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    
    const entry = this.cache.get(key);
    
    // 检查过期
    if (Date.now() - entry.createdAt > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    entry.access();
    return entry.value;
  }
  
  set(key, value, metadata = {}) {
    // 如果已存在，更新
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      entry.value = value;
      entry.metadata = { ...entry.metadata, ...metadata };
      entry.access();
    } else {
      // LRU淘汰
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.findOldest();
        if (oldestKey) this.cache.delete(oldestKey);
      }
      
      this.cache.set(key, new CacheEntry(key, value, metadata));
    }
    
    // 定期保存
    if (this.cache.size % 10 === 0) {
      this.save();
    }
  }
  
  findOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
    this.save();
  }
  
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }
  
  calculateHitRate() {
    let total = 0;
    let hits = 0;
    for (const entry of this.cache.values()) {
      total += entry.accessCount;
      hits++;
    }
    return total > 0 ? (hits / total).toFixed(2) : 0;
  }
}

// 关键词索引
class KeywordIndex {
  constructor() {
    this.indexFile = path.join(CONFIG.indexDir, 'keyword-index.json');
    this.index = new Map();
    this.load();
  }
  
  load() {
    if (fs.existsSync(this.indexFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.indexFile, 'utf-8'));
        this.index = new Map(Object.entries(data.index || {}));
      } catch (e) {
        this.index = new Map();
      }
    }
  }
  
  save() {
    if (!fs.existsSync(CONFIG.indexDir)) {
      fs.mkdirSync(CONFIG.indexDir, { recursive: true });
    }
    const data = {
      index: Object.fromEntries(this.index),
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync(this.indexFile, JSON.stringify(data, null, 2), 'utf-8');
  }
  
  // 索引文本
  indexDocument(docId, content, metadata = {}) {
    const words = this.tokenize(content);
    
    for (const word of words) {
      if (!this.index.has(word)) {
        this.index.set(word, { docs: new Set(), count: 0 });
      }
      
      const entry = this.index.get(word);
      entry.docs.add(docId);
      entry.count++;
    }
    
    this.save();
  }
  
  // 分词
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }
  
  // 搜索
  search(query, limit = 20) {
    const words = this.tokenize(query);
    const scores = new Map();
    
    for (const word of words) {
      if (this.index.has(word)) {
        const entry = this.index.get(word);
        for (const docId of entry.docs) {
          const currentScore = scores.get(docId) || 0;
          scores.set(docId, currentScore + entry.count);
        }
      }
    }
    
    // 排序并返回top结果
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId, score]) => ({ docId, score }));
  }
  
  // 删除文档
  removeDocument(docId) {
    for (const [word, entry] of this.index) {
      entry.docs.delete(docId);
      if (entry.docs.size === 0) {
        this.index.delete(word);
      }
    }
    this.save();
  }
  
  stats() {
    return {
      wordCount: this.index.size,
      lastUpdate: this.index.size > 0 
        ? fs.existsSync(this.indexFile) ? fs.statSync(this.indexFile).mtime : null 
        : null
    };
  }
}

// 极速检索系统
class FastMemorySystem {
  constructor() {
    this.lruCache = new LRUCache(CONFIG.maxCacheSize, CONFIG.maxCacheAge);
    this.keywordIndex = new KeywordIndex();
    this.retrievalCount = 0;
    this.totalRetrievalTime = 0;
  }
  
  // 极速检索
  async retrieve(query, options = {}) {
    const startTime = Date.now();
    
    try {
      // 1. 缓存查找
      const cacheKey = `query:${md5(query)}`;
      let cached = this.lruCache.get(cacheKey);
      
      if (cached) {
        const retrievalTime = Date.now() - startTime;
        this.logRetrieval(retrievalTime, true);
        return {
          ...cached,
          retrievalTime,
          cached: true
        };
      }
      
      // 2. 索引搜索
      const results = this.keywordIndex.search(query, options.limit || CONFIG.defaultLimit);
      
      // 3. 获取完整文档
      const documents = await this.getDocuments(results.map(r => r.docId));
      
      const retrievalTime = Date.now() - startTime;
      
      // 4. 缓存结果
      const resultData = {
        query,
        results: documents,
        totalResults: documents.length,
        retrievalTime
      };
      
      this.lruCache.set(cacheKey, resultData);
      this.logRetrieval(retrievalTime, false);
      
      return resultData;
      
    } catch (error) {
      console.error('❌ 检索失败:', error);
      return { error: error.message, retrievalTime: Date.now() - startTime };
    }
  }
  
  // 获取文档
  async getDocuments(docIds) {
    const documents = [];
    
    for (const docId of docIds) {
      // 尝试多个位置查找
      const possiblePaths = [
        path.join(CONFIG.memoryDir, 'daily', `${docId}.md`),
        path.join(CONFIG.memoryDir, 'topics', `${docId}.md`),
        path.join(CONFIG.memoryDir, `${docId}.md`)
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          documents.push({
            id: docId,
            path: p,
            content: fs.readFileSync(p, 'utf-8'),
            lastModified: fs.statSync(p).mtime
          });
          break;
        }
      }
    }
    
    return documents;
  }
  
  // 索引记忆文件
  async indexMemoryFile(filePath, docId = null) {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const id = docId || path.basename(filePath, '.md');
    
    this.keywordIndex.indexDocument(id, content, {
      path: filePath,
      lastModified: fs.statSync(filePath).mtime.toISOString()
    });
    
    console.log(`✅ 已索引: ${id}`);
  }
  
  // 索引整个记忆目录
  async indexAllMemories() {
    console.log('\n🚀 ========== 索引记忆文件 ==========\n');
    const startTime = Date.now();
    
    const dirs = ['daily', 'topics', 'people'].filter(d => 
      fs.existsSync(path.join(CONFIG.memoryDir, d))
    );
    
    for (const dir of dirs) {
      const dirPath = path.join(CONFIG.memoryDir, dir);
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      
      console.log(`📁 索引 ${dir}: ${files.length} 文件`);
      
      for (const file of files) {
        await this.indexMemoryFile(path.join(dirPath, file));
      }
    }
    
    const time = Date.now() - startTime;
    console.log(`\n✨ 索引完成! 耗时: ${time}ms`);
    console.log(`📊 词索引: ${this.keywordIndex.stats().wordCount} 词`);
  }
  
  logRetrieval(time, cached) {
    this.retrievalCount++;
    this.totalRetrievalTime += time;
  }
  
  getPerformanceStats() {
    return {
      totalRetrievals: this.retrievalCount,
      avgRetrievalTime: this.retrievalCount > 0 
        ? (this.totalRetrievalTime / this.retrievalCount).toFixed(2) 
        : 0,
      cacheStats: this.lruCache.stats(),
      indexStats: this.keywordIndex.stats(),
      targetMet: this.retrievalCount > 0 
        ? (this.totalRetrievalTime / this.retrievalCount) < 10 
        : null
    };
  }
}

// 工具函数
function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// 初始化系统
const memorySystem = new FastMemorySystem();

// 导出
module.exports = {
  memorySystem,
  LRUCache,
  KeywordIndex,
  FastMemorySystem
};

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'index') {
    // 索引所有记忆
    memorySystem.indexAllMemories();
  } else if (args[0] === 'stats') {
    // 显示性能统计
    const stats = memorySystem.getPerformanceStats();
    console.log('\n📊 记忆系统性能统计\n');
    console.log(JSON.stringify(stats, null, 2));
  } else if (args[0] === 'search') {
    // 搜索
    const query = args.slice(1).join(' ');
    memorySystem.retrieve(query).then(console.log);
  } else if (args[0] === 'clear') {
    // 清除缓存
    memorySystem.lruCache.clear();
    console.log('✅ 缓存已清除');
  } else {
    console.log('用法:');
    console.log('  node memory-cache.js index   - 索引所有记忆');
    console.log('  node memory-cache.js stats   - 显示性能统计');
    console.log('  node memory-cache.js search  - 搜索记忆');
    console.log('  node memory-cache.js clear   - 清除缓存');
  }
}
