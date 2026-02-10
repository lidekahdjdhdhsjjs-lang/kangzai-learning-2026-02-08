#!/usr/bin/env node
/**
 * 康仔智能任务优先级评分系统 (Smart Prioritization Layer 8)
 * 根据多维度因素智能评估任务优先级
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  taskDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'tasks'),
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, 'STATE.md'),
  configDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'config'),
  priorityHistoryFile: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'priority-history.json')
};

// 优先级评分因素
const FACTORS = {
  URGENCY: {
    name: '紧急程度',
    weight: 0.35,
    maxScore: 100
  },
  IMPORTANCE: {
    name: '重要性',
    weight: 0.25,
    maxScore: 100
  },
  DEPENDENCY: {
    name: '依赖性',
    weight: 0.15,
    maxScore: 100
  },
  RECURRENCE: {
    name: '周期性',
    weight: 0.10,
    maxScore: 100
  },
  USER_PREFERENCE: {
    name: '用户偏好',
    weight: 0.10,
    maxScore: 100
  },
  SYSTEM_LOAD: {
    name: '系统负载',
    weight: 0.05,
    maxScore: 100
  }
};

// 任务类
class Task {
  constructor(id, data = {}) {
    this.id = id;
    this.title = data.title || '';
    this.description = data.description || '';
    this.priority = data.priority || 0; // 原始优先级 1-5
    this.category = data.category || 'general';
    this.deadline = data.deadline || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.status = data.status || 'pending';
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.score = 0; // 综合评分
    this.factors = {}; // 各因素评分
  }
}

// 智能优先级评分器
class SmartPrioritizer {
  constructor() {
    this.tasks = new Map();
    this.loadTasks();
    this.loadHistory();
  }

  // 加载任务
  loadTasks() {
    if (!fs.existsSync(CONFIG.taskDir)) {
      fs.mkdirSync(CONFIG.taskDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(CONFIG.taskDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const data = JSON.parse(
          fs.readFileSync(path.join(CONFIG.taskDir, file), 'utf-8')
        );
        this.tasks.set(data.id, new Task(data.id, data));
      } catch (e) {
        console.warn(`加载任务失败: ${file}`);
      }
    }
  }

  // 加载历史评分
  loadHistory() {
    this.history = {
      completedTasks: [],
      avgScores: { daily: [], weekly: [] },
      lastUpdated: new Date().toISOString()
    };

    if (fs.existsSync(CONFIG.priorityHistoryFile)) {
      try {
        this.history = JSON.parse(
          fs.readFileSync(CONFIG.priorityHistoryFile, 'utf-8')
        );
      } catch (e) {}
    }
  }

  // 保存历史评分
  saveHistory() {
    this.history.lastUpdated = new Date().toISOString();
    fs.writeFileSync(
      CONFIG.priorityHistoryFile,
      JSON.stringify(this.history, null, 2),
      'utf-8'
    );
  }

  // 评估紧急程度 (0-100)
  evaluateUrgency(task) {
    let score = 50; // 基础分

    // 截止日期评估
    if (task.deadline) {
      const now = new Date();
      const deadline = new Date(task.deadline);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      
      if (hoursUntilDeadline < 0) {
        score = 100; // 已过期，最紧急
      } else if (hoursUntilDeadline < 1) {
        score = 95; // 1小时内
      } else if (hoursUntilDeadline < 6) {
        score = 85; // 6小时内
      } else if (hoursUntilDeadline < 24) {
        score = 70; // 24小时内
      } else if (hoursUntilDeadline < 72) {
        score = 55; // 3天内
      } else {
        score = 40; // 3天以上
      }
    }

    // 原始优先级影响
    const priorityMap = { 1: 80, 2: 60, 3: 40, 4: 20, 5: 0 };
    const priorityBonus = priorityMap[task.priority] || 50;
    
    // 合并计算
    score = (score * 0.7) + (priorityBonus * 0.3);

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // 评估重要性 (0-100)
  evaluateImportance(task) {
    let score = 50;

    // 类别权重
    const categoryWeights = {
      'critical': 100,
      'important': 80,
      'normal': 60,
      'low': 40,
      'learning': 70,
      'optimization': 75,
      'health': 90
    };

    const categoryScore = categoryWeights[task.category] || 60;
    
    // 标签权重
    const tagWeights = {
      'user-request': 85,
      'system': 70,
      'learning': 65,
      'memory': 60,
      'health': 90,
      'security': 95
    };

    let tagScore = 60;
    for (const tag of task.tags) {
      if (tagWeights[tag]) {
        tagScore = Math.max(tagScore, tagWeights[tag]);
      }
    }

    // 合并
    score = (categoryScore * 0.6) + (tagScore * 0.4);

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // 评估依赖性 (0-100)
  evaluateDependency(task) {
    // 简化的依赖评估
    let score = 50;

    // 有依赖的任务优先级更高
    if (task.metadata && task.metadata.dependencies && task.metadata.dependencies.length > 0) {
      score = 70 + (Math.min(task.metadata.dependencies.length, 5) * 5);
    }

    // 被其他任务依赖
    if (task.metadata && task.metadata.blockedBy && task.metadata.blockedBy.length > 0) {
      score = Math.min(100, score + 20);
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // 评估周期性 (0-100)
  evaluateRecurrence(task) {
    let score = 30;

    // 周期性任务
    if (task.metadata && task.metadata.recurring) {
      const frequency = task.metadata.frequency || 'daily';
      const freqMap = { 'hourly': 100, 'daily': 80, 'weekly': 60, 'monthly': 40 };
      score = freqMap[frequency] || 60;
    }

    return score;
  }

  // 评估用户偏好 (0-100)
  evaluateUserPreference(task) {
    let score = 60;

    // 用户明确要求的高优先级
    if (task.tags && task.tags.includes('user-request')) {
      score = 90;
    }

    // 按时段偏好
    const hour = new Date().getHours();
    const timePreference = {
      'morning': hour >= 6 && hour < 12 ? 80 : 50,
      'afternoon': hour >= 12 && hour < 18 ? 80 : 50,
      'evening': hour >= 18 && hour < 23 ? 80 : 50,
      'night': hour >= 23 || hour < 6 ? 70 : 50
    };

    if (task.metadata && task.metadata.preferredTime) {
      score = Math.max(score, timePreference[task.metadata.preferredTime] || 60);
    }

    return score;
  }

  // 评估系统负载 (0-100) - 负载越高，分数越低
  evaluateSystemLoad(task) {
    let score = 80; // 默认系统负载低

    try {
      const memUsage = process.memoryUsage();
      const heapUsed = memUsage.heapUsed / memUsage.heapTotal;
      
      if (heapUsed > 0.9) {
        score = 30; // 内存紧张
      } else if (heapUsed > 0.7) {
        score = 50;
      } else if (heapUsed > 0.5) {
        score = 70;
      }
    } catch (e) {}

    return score;
  }

  // 综合评分
  calculateScore(task) {
    const urgency = this.evaluateUrgency(task);
    const importance = this.evaluateImportance(task);
    const dependency = this.evaluateDependency(task);
    const recurrence = this.evaluateRecurrence(task);
    const userPref = this.evaluateUserPreference(task);
    const systemLoad = this.evaluateSystemLoad(task);

    // 加权总分
    const totalScore = 
      urgency * FACTORS.URGENCY.weight +
      importance * FACTORS.IMPORTANCE.weight +
      dependency * FACTORS.DEPENDENCY.weight +
      recurrence * FACTORS.RECURRENCE.weight +
      userPref * FACTORS.USER_PREFERENCE.weight +
      systemLoad * FACTORS.SYSTEM_LOAD.weight;

    task.factors = {
      urgency,
      importance,
      dependency,
      recurrence,
      userPreference: userPref,
      systemLoad
    };

    task.score = Math.round(totalScore);

    return task;
  }

  // 对所有任务评分
  prioritizeAll() {
    console.log('\n🧠 智能优先级评分系统\n');

    let rankedTasks = [];

    for (const [id, task] of this.tasks) {
      if (task.status === 'pending') {
        this.calculateScore(task);
        rankedTasks.push(task);
      }
    }

    // 按分数排序
    rankedTasks.sort((a, b) => b.score - a.score);

    // 显示结果
    console.log('📊 任务优先级排名:\n');
    console.log('排名 | 分数 | 紧急 | 重要 | 依赖 | 周期 | 用户 | 系统 | 任务');
    console.log('-'.repeat(80));

    for (let i = 0; i < rankedTasks.length; i++) {
      const task = rankedTasks[i];
      const factors = task.factors;
      console.log(
        `${(i + 1).toString().padStart(3)} | ${task.score.toString().padStart(3)} | ` +
        `${factors.urgency.toString().padStart(3)} | ${factors.importance.toString().padStart(3)} | ` +
        `${factors.dependency.toString().padStart(3)} | ${factors.recurrence.toString().padStart(3)} | ` +
        `${factors.userPreference.toString().padStart(3)} | ${factors.systemLoad.toString().padStart(3)} | ` +
        `${task.title.substring(0, 30)}`
      );
    }

    // 更新任务分数
    for (const task of rankedTasks) {
      this.tasks.set(task.id, task);
      this.saveTask(task);
    }

    // 保存历史
    this.history.lastPrioritization = new Date().toISOString();
    this.history.totalTasks = rankedTasks.length;
    this.saveHistory();

    return rankedTasks;
  }

  // 保存单个任务
  saveTask(task) {
    const filePath = path.join(CONFIG.taskDir, `${task.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(task, null, 2), 'utf-8');
  }

  // 获取Top N任务
  getTopTasks(n = 5) {
    const ranked = this.prioritizeAll();
    return ranked.slice(0, n);
  }

  // 生成优先级报告
  generateReport() {
    const ranked = this.prioritizeAll();
    
    const report = {
      timestamp: new Date().toISOString(),
      totalTasks: ranked.length,
      topTasks: ranked.slice(0, 10).map(t => ({
        id: t.id,
        title: t.title,
        score: t.score,
        factors: t.factors
      })),
      averageScore: ranked.length > 0 
        ? Math.round(ranked.reduce((a, b) => a + b.score, 0) / ranked.length)
        : 0,
      factorBreakdown: {
        avgUrgency: ranked.length > 0 
          ? Math.round(ranked.reduce((a, b) => a + b.factors.urgency, 0) / ranked.length)
          : 0,
        avgImportance: ranked.length > 0 
          ? Math.round(ranked.reduce((a, b) => a + b.factors.importance, 0) / ranked.length)
          : 0,
        avgDependency: ranked.length > 0 
          ? Math.round(ranked.reduce((a, b) => a + b.factors.dependency, 0) / ranked.length)
          : 0
      }
    };

    return report;
  }

  // 添加新任务
  addTask(title, options = {}) {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = new Task(id, {
      title,
      ...options
    });
    
    this.calculateScore(task);
    this.tasks.set(id, task);
    this.saveTask(task);
    
    console.log(`✅ 添加任务: "${title}" (优先级分数: ${task.score})`);
    
    return task;
  }

  // 快速评分单个任务
  quickScore(title, deadline = null, priority = 3) {
    const task = new Task('quick', {
      title,
      deadline,
      priority
    });
    
    this.calculateScore(task);
    
    console.log(`\n📊 快速评分: "${title}"`);
    console.log(`   总分: ${task.score}/100`);
    console.log(`   紧急: ${task.factors.urgency}/100`);
    console.log(`   重要: ${task.factors.importance}/100`);
    console.log(`   依赖: ${task.factors.dependency}/100`);
    console.log(`   周期: ${task.factors.recurrence}/100`);
    console.log(`   用户: ${task.factors.userPreference}/100`);
    console.log(`   系统: ${task.factors.systemLoad}/100`);
    
    return task.score;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const prioritizer = new SmartPrioritizer();

  if (args[0] === 'add') {
    // 添加任务格式: node smart-prioritizer.js add "任务标题" [--deadline=date] [--category=cat]
    let title = '';
    const options = {
      priority: 3,
      deadline: null,
      category: 'normal'
    };
    
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--deadline=')) {
        options.deadline = arg.split('=')[1];
      } else if (arg.startsWith('--category=')) {
        options.category = arg.split('=')[1];
      } else if (arg.startsWith('--priority=')) {
        options.priority = parseInt(arg.split('=')[1]);
      } else if (!arg.startsWith('--')) {
        title = arg;
      }
    }
    
    // 如果 title 是空的，尝试从第一个非 -- 参数获取
    if (!title || title === args[1]) {
      // 移除所有 -- 开头的参数后的部分作为标题
      const firstDashIndex = args.findIndex(a => a.startsWith('--'));
      if (firstDashIndex > 1) {
        title = args.slice(1, firstDashIndex).join(' ');
      } else {
        title = args.slice(1).join(' ').replace(/--\S+/g, '').trim();
      }
    }
    
    prioritizer.addTask(title, options);

  } else if (args[0] === 'score') {
    // 快速评分
    const title = args.slice(1).join(' ');
    prioritizer.quickScore(title);

  } else if (args[0] === 'report') {
    // 生成报告
    const report = prioritizer.generateReport();
    console.log('\n📊 优先级报告:');
    console.log(JSON.stringify(report, null, 2));

  } else if (args[0] === 'top') {
    // Top N 任务
    const n = parseInt(args[1]) || 5;
    const topTasks = prioritizer.getTopTasks(n);
    console.log('\n🎯 Top', n, '任务:');
    for (const task of topTasks) {
      console.log(`  ${task.score}: ${task.title}`);
    }

  } else {
    // 默认: 全部评分
    const ranked = prioritizer.prioritizeAll();
    console.log(`\n✅ 完成! 共 ${ranked.length} 个待办任务已评分`);
  }
}

// 导出
module.exports = {
  SmartPrioritizer,
  Task,
  FACTORS
};

// 直接运行
if (require.main === module) {
  main().catch(console.error);
}
