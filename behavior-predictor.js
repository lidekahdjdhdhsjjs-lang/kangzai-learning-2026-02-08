#!/usr/bin/env node
/**
 * 康仔用户行为分析 & 需求预测引擎
 * 分析用户行为模式，预测未来需求
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  sessionsDir: path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'agents', 'main', 'sessions'),
  memoryDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory'),
  behaviorFile: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'behavior-pattern.json'),
  predictionsFile: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'predictions.json'),
};

// 常见用户意图模式
const INTENT_PATTERNS = {
  'coding': ['代码', '编程', '开发', '写', 'create', 'build', 'code', 'debug'],
  'search': ['搜索', '查找', '找', 'search', 'find', 'look'],
  'learning': ['学习', '了解', '什么是', '学习', 'learn', 'teach'],
  'system': ['系统', '状态', 'status', 'system', '配置', 'config'],
  'communication': ['发送', '消息', '通知', 'send', 'message', '通知'],
  'file': ['文件', '读取', '写入', '编辑', 'file', 'read', 'write', 'edit'],
  'automation': ['自动', '定时', 'cron', 'schedule', '自动化'],
  'installation': ['安装', 'install', '设置', 'setup']
};

// 分析单条消息意图
function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  const scores = {};
  
  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    scores[intent] = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[intent]++;
      }
    }
  }
  
  // 返回最高分意图
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'general';
}

// 提取时间模式
function extractTimePattern(message) {
  const timePatterns = [
    /早上|上午|早安/gi,
    /下午|中午/gi,
    /晚上|晚安/gi,
    /\d+点/gi,
    /今天|今日/gi,
    /明天|明日/gi
  ];
  
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

// 从会话历史提取行为模式
function extractBehaviorFromSessions() {
  const behaviors = {
    hourlyActivity: new Array(24).fill(0),  // 每小时活动数
    dailyActivity: new Array(7).fill(0),    // 每周每日活动数
    weeklyIntentCount: {},                  // 每周意图统计
    sessionLengths: [],                     // 会话长度
    lastActiveTime: null,
    topIntents: [],
    commonPatterns: []
  };
  
  if (!fs.existsSync(CONFIG.sessionsDir)) {
    return null;
  }
  
  const sessions = fs.readdirSync(CONFIG.sessionsDir).filter(f => f.endsWith('.jsonl'));
  
  for (const sessionFile of sessions.slice(-50)) { // 只分析最近50个会话
    try {
      const content = fs.readFileSync(path.join(CONFIG.sessionsDir, sessionFile), 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      
      if (lines.length === 0) continue;
      
      // 解析第一条消息的时间
      const firstLine = JSON.parse(lines[0]);
      if (firstLine.timestamp) {
        const time = new Date(firstLine.timestamp);
        behaviors.hourlyActivity[time.getHours()]++;
        behaviors.dailyActivity[time.getDay()]++;
        behaviors.lastActiveTime = firstLine.timestamp;
      }
      
      // 分析所有用户消息
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.role === 'user' && data.message?.content) {
            const content = data.message.content;
            const intent = analyzeIntent(content);
            behaviors.weeklyIntentCount[intent] = (behaviors.weeklyIntentCount[intent] || 0) + 1;
            
            // 提取时间模式
            const timePattern = extractTimePattern(content);
            if (timePattern) {
              behaviors.commonPatterns.push({ pattern: timePattern, intent });
            }
          }
        } catch (e) {}
      }
      
      behaviors.sessionLengths.push(lines.length);
      
    } catch (e) {}
  }
  
  // 计算top意图
  behaviors.topIntents = Object.entries(behaviors.weeklyIntentCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return behaviors;
}

// 生成需求预测
function generatePredictions(behaviors) {
  if (!behaviors) {
    return {
      timestamp: new Date().toISOString(),
      predictions: [],
      confidence: 0,
      message: '数据不足，无法生成预测'
    };
  }
  
  const predictions = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  // 1. 时间相关预测
  const hourlyActivity = behaviors.hourlyActivity;
  const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
  const lowHour = hourlyActivity.indexOf(Math.min(...hourlyActivity.filter(v => v > 0)));
  
  if (Math.abs(currentHour - peakHour) <= 2) {
    predictions.push({
      type: 'time',
      title: '📈 高峰时段',
      description: `当前接近你最活跃的时间段(约${peakHour}点)，可能会发送较多请求`,
      confidence: 0.8
    });
  }
  
  // 2. 意图预测
  if (behaviors.topIntents.length > 0) {
    const [topIntent, count] = behaviors.topIntents[0];
    const intentNames = {
      'coding': '编程开发',
      'search': '信息搜索',
      'learning': '学习了解',
      'system': '系统操作',
      'communication': '消息发送',
      'file': '文件处理',
      'automation': '自动化任务',
      'installation': '安装配置'
    };
    
    predictions.push({
      type: 'intent',
      title: '🎯 最可能的需求',
      description: `根据历史分析，你最常进行「${intentNames[topIntent] || topIntent}」操作 (${count}次)`,
      confidence: Math.min(0.9, 0.5 + count * 0.05),
      action: `准备${intentNames[topIntent] || topIntent}相关的上下文`
    });
  }
  
  // 3. 行为模式预测
  if (behaviors.commonPatterns.length > 0) {
    const patternCounts = {};
    behaviors.commonPatterns.forEach(p => {
      patternCounts[p.pattern] = (patternCounts[p.pattern] || 0) + 1;
    });
    const topPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0];
    
    if (topPattern) {
      predictions.push({
        type: 'pattern',
        title: '⏰ 时间模式',
        description: `你经常在"${topPattern[0]}"时使用我`,
        confidence: 0.7,
        action: '预加载相关上下文'
      });
    }
  }
  
  // 4. 系统维护建议
  const daysSinceLastActive = behaviors.lastActiveTime 
    ? Math.floor((Date.now() - new Date(behaviors.lastActiveTime).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  if (daysSinceLastActive && daysSinceLastActive > 2) {
    predictions.push({
      type: 'system',
      title: '🔧 系统维护提醒',
      description: `你已经${daysSinceLastActive}天没有活动了`,
      confidence: 0.9,
      action: '检查系统状态、更新知识库'
    });
  }
  
  return {
    timestamp: new Date().toISOString(),
    predictions,
    confidence: predictions.length > 0 
      ? predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length 
      : 0,
    topIntent: behaviors.topIntents[0]?.[0] || null
  };
}

// 主动建议生成
function generateProactiveSuggestions(predictions) {
  const suggestions = [];
  
  for (const pred of predictions.predictions || []) {
    if (pred.action) {
      suggestions.push({
        trigger: pred.title,
        suggestion: pred.action,
        confidence: pred.confidence
      });
    }
  }
  
  return suggestions;
}

// 保存行为模式
function saveBehaviorPattern(behaviors) {
  fs.writeFileSync(CONFIG.behaviorFile, JSON.stringify({
    ...behaviors,
    lastUpdate: new Date().toISOString()
  }, null, 2), 'utf-8');
  console.log(`✅ 行为模式已保存: ${CONFIG.behaviorFile}`);
}

// 保存预测结果
function savePredictions(predictions) {
  fs.writeFileSync(CONFIG.predictionsFile, JSON.stringify(predictions, null, 2), 'utf-8');
  console.log(`✅ 预测结果已保存: ${CONFIG.predictionsFile}`);
}

// 主动预加载上下文
function preloadContext(predictions) {
  const context = {
    timestamp: new Date().toISOString(),
    predictions,
    preloadActions: []
  };
  
  // 根据预测预加载
  for (const pred of predictions.predictions || []) {
    if (pred.type === 'intent') {
      context.preloadActions.push({
        action: `预加载${pred.description}`,
        status: 'ready'
      });
    }
  }
  
  return context;
}

// 主函数
function analyzeAndPredict() {
  console.log('\n🧠 ========== 用户行为分析 & 需求预测 ==========\n');
  
  try {
    // 1. 提取行为模式
    console.log('📊 分析会话历史...');
    const behaviors = extractBehaviorFromSessions();
    
    if (behaviors) {
      saveBehaviorPattern(behaviors);
      
      console.log(`  - 分析 ${behaviors.sessionLengths?.length || 0} 个会话`);
      console.log(`  - 高峰时段: ${behaviors.hourlyActivity.indexOf(Math.max(...behaviors.hourlyActivity.filter(v => v > 0)))}:00`);
      console.log(`  - 最常见意图: ${behaviors.topIntents[0]?.[0] || 'N/A'}`);
    } else {
      console.log('  ⚠️ 无法读取会话历史');
    }
    
    // 2. 生成预测
    console.log('\n🔮 生成需求预测...');
    const predictions = generatePredictions(behaviors);
    savePredictions(predictions);
    
    console.log(`  - 生成 ${predictions.predictions?.length || 0} 条预测`);
    console.log(`  - 置信度: ${(predictions.confidence * 100).toFixed(1)}%`);
    
    // 3. 生成主动建议
    const suggestions = generateProactiveSuggestions(predictions);
    console.log(`  - 可执行建议: ${suggestions.length}`);
    
    // 4. 预加载上下文
    const context = preloadContext(predictions);
    
    console.log('\n✨ 分析完成！');
    
    return {
      behaviors,
      predictions,
      suggestions,
      context
    };
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
    return null;
  }
}

// 导出
module.exports = {
  analyzeIntent,
  extractTimePattern,
  extractBehaviorFromSessions,
  generatePredictions,
  generateProactiveSuggestions,
  preloadContext,
  analyzeAndPredict
};

// 直接运行
if (require.main === module) {
  analyzeAndPredict();
}
