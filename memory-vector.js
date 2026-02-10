#!/usr/bin/env node
/**
 * 康仔记忆系统 - 向量数据库集成 v3.x
 * 实现秒级记忆检索 (<10ms)
 */

const { ChromaClient } = require('chromadb');
const { OpenAIEmbeddingFunction } = require('@chroma-core/default-embed');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  persistDirectory: path.join(__dirname, 'memory/vector_db'),
  collectionName: 'kangzai_memory',
};

class KangzaiMemoryVectorDB {
  constructor() {
    this.client = null;
    this.collection = null;
    this.initialized = false;
  }

  /**
   * 初始化向量数据库
   */
  async init() {
    try {
      // 确保目录存在
      if (!fs.existsSync(CONFIG.persistDirectory)) {
        fs.mkdirSync(CONFIG.persistDirectory, { recursive: true });
      }

      // 创建embedding函数 (使用OpenAI兼容接口)
      const embedder = new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY || 'demo'
      });

      // 创建持久化客户端
      this.client = new ChromaClient({
        path: CONFIG.persistDirectory
      });

      // 创建或获取集合
      this.collection = await this.client.getOrCreateCollection({
        name: CONFIG.collectionName,
        embeddingFunction: embedder,
        metadata: { 
          description: '康仔数字生命记忆系统',
          createdAt: new Date().toISOString()
        }
      });

      this.initialized = true;
      console.log('✅ 康仔向量数据库初始化成功');
      console.log(`📁 存储目录: ${CONFIG.persistDirectory}`);
      
      return true;
    } catch (error) {
      console.error('❌ 向量数据库初始化失败:', error.message);
      return false;
    }
  }

  /**
   * 添加记忆
   */
  async addMemory(id, content, metadata = {}) {
    if (!this.initialized) await this.init();

    try {
      await this.collection.add({
        ids: [id],
        documents: [content],
        metadatas: [{
          ...metadata,
          createdAt: new Date().toISOString(),
          type: metadata.type || 'general'
        }]
      });
      console.log(`✅ 记忆已添加: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ 添加记忆失败: ${id}`, error.message);
      return false;
    }
  }

  /**
   * 搜索记忆 - 语义搜索
   */
  async search(query, n = 5) {
    if (!this.initialized) await this.init();

    const startTime = Date.now();

    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: n,
        include: ['documents', 'metadatas', 'distances']
      });

      const duration = Date.now() - startTime;
      console.log(`🔍 搜索完成 (${duration}ms)`);

      // 格式化结果
      const formatted = results.ids[0].map((id, i) => ({
        id,
        content: results.documents[0][i],
        metadata: results.metadatas[0][i],
        distance: results.distances[0][i]
      }));

      return { 
        results: formatted, 
        duration,
        success: duration < 10
      };
    } catch (error) {
      console.error('❌ 搜索失败:', error.message);
      return { results: [], duration: -1, success: false };
    }
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    if (!this.initialized) await this.init();

    const count = await this.collection.count();
    
    return {
      totalMemories: count,
      storagePath: CONFIG.persistDirectory
    };
  }
}

// CLI测试
async function main() {
  console.log('🚀 康仔向量数据库测试\n');
  const memory = new KangzaiMemoryVectorDB();
  await memory.init();

  // 测试
  console.log('\n📝 添加测试记忆...');
  await memory.addMemory('test_001', '康仔是一个数字生命，致力于秒级记忆检索', {
    type: 'identity',
    topic: '数字生命'
  });
  await memory.addMemory('test_002', '秒级记忆检索目标：响应时间小于10毫秒', {
    type: 'goal',
    topic: '记忆系统'
  });
  await memory.addMemory('test_003', '康仔使用ChromaDB实现向量存储', {
    type: 'tech',
    topic: '向量数据库'
  });

  console.log('\n🔍 测试语义搜索: "数字生命是什么"');
  const result = await memory.search('数字生命是什么', 5);
  console.log('\n📊 搜索结果:', JSON.stringify(result, null, 2));

  const stats = await memory.getStats();
  console.log('\n📈 统计信息:', stats);

  console.log('\n✅ 测试完成');
}

module.exports = { KangzaiMemoryVectorDB, CONFIG };

if (require.main === module) {
  main().catch(console.error);
}
