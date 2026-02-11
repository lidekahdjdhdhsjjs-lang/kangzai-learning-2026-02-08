#!/usr/bin/env node
/**
 * 康仔行为追踪器 - 用户需求预测的基础
 * 追踪用户行为模式，用于主动预测需求
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'memory/behavior_tracker.json');

class BehaviorTracker {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      // 已移除
    }
    return {
      sessions: [],          // 会话记录
      queries: [],            // 查询记录
      activeHours: {},        // 活跃时段 {hour: count}
      queryTypes: {},         // 查询类型 {type: count}
      interests: [],          // 兴趣标签
      lastActive: null,       // 最后活跃时间
      createdAt: new Date().toISOString()
    };
  }

  save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  /**
   * 记录一次会话
   */
  recordSession(channel, duration) {
    this.data.sessions.push({
      timestamp: new Date().toISOString(),
      channel,
      duration
    });
    this.data.lastActive = new Date().toISOString();
    this.save();
    // 已移除
  }

  /**
   * 记录一次查询
   */
  recordQuery(query, type, tags = []) {
    const hour = new Date().getHours();
    const timestamp = new Date().toISOString();
    
    this.data.queries.push({ query, type, tags, timestamp, hour });
    
    // 更新活跃时段
    this.data.activeHours[hour] = (this.data.activeHours[hour] || 0) + 1;
    
    // 更新查询类型
    this.data.queryTypes[type] = (this.data.queryTypes[type] || 0) + 1;
    
    // 更新兴趣标签
    tags.forEach(tag => {
      if (!this.data.interests.includes(tag)) {
        this.data.interests.push(tag);
      }
    });
    
    this.data.lastActive = timestamp;
    this.save();
    
    // 已移除}...`);
  }

  /**
   * 获取活跃时段
   */
  getActiveHours(topN = 3) {
    const sorted = Object.entries(this.data.activeHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        period: this.getPeriod(parseInt(hour))
      }));
    
    return sorted;
  }

  getPeriod(hour) {
    if (hour >= 5 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚上';
    return '深夜';
  }

  /**
   * 获取常见查询类型
   */
  getFrequentTypes(topN = 3) {
    return Object.entries(this.data.queryTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * 预测用户需求
   */
  predictNeeds() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentPeriod = this.getPeriod(currentHour);
    
    const predictions = [];
    
    // 1. 时间预测
    const activeHours = this.getActiveHours(3);
    if (activeHours.some(h => h.hour === currentHour)) {
      predictions.push({
        type: 'time_based',
        confidence: 0.8,
        message: '根据历史数据，这个时段你通常很活跃'
      });
    }
    
    // 2. 类型预测
    const frequent = this.getFrequentTypes(3);
    if (frequent.length > 0) {
      predictions.push({
        type: 'pattern_based',
        confidence: 0.6,
        message: `你经常查询: ${frequent.map(f => f.type).join(', ')}`
      });
    }
    
    // 3. 兴趣预测
    if (this.data.interests.length > 0) {
      predictions.push({
        type: 'interest_based',
        confidence: 0.5,
        message: `你感兴趣的领域: ${this.data.interests.slice(0, 3).join(', ')}`
      });
    }
    
    return {
      currentPeriod,
      predictions,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalSessions: this.data.sessions.length,
      totalQueries: this.data.queries.length,
      activeHours: Object.keys(this.data.activeHours).length,
      queryTypes: Object.keys(this.data.queryTypes).length,
      interestsCount: this.data.interests.length,
      lastActive: this.data.lastActive
    };
  }
}

// CLI测试
async function main() {
  // 已移除
  
  const tracker = new BehaviorTracker();
  
  // 模拟一些数据
  // 已移除);
  
  // 已移除
  // 已移除, null, 2));
  
  // 已移除
  // 已移除);
  
  // 已移除
  // 已移除);
  
  // 记录测试查询
  // 已移除
  tracker.recordQuery('今天学习了什么', 'learning', ['AI', 'memory']);
  tracker.recordQuery('播放音乐', 'music', ['entertainment']);
  tracker.recordQuery('GitHub趋势', 'github', ['tech', 'trending']);
  
  // 已移除
}

module.exports = { BehaviorTracker };

if (require.main === module) {
  main().catch(console.error);
}
