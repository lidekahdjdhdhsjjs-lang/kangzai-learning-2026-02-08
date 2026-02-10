#!/usr/bin/env node
/**
 * 康仔多代理协作系统
 * 任务分发、协作调度、结果聚合
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 配置
const CONFIG = {
  taskQueueDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'tasks'),
  resultsDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'results'),
  agentPoolDir: path.join(process.env.USERPROFILE || process.env.HOME, 'memory', 'agents'),
  maxAgents: 4,
  taskTimeout: 300000 // 5分钟
};

// 任务状态
const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// 任务类型
const TASK_TYPES = {
  PARALLEL: 'parallel',    // 并行分发
  SEQUENTIAL: 'sequential',// 顺序执行
  ROUND_ROBIN: 'round_robin', // 轮询分发
  PRIORITY: 'priority'     // 优先级分发
};

// 任务类
class Task {
  constructor(id, type, description, subtasks = [], options = {}) {
    this.id = id;
    this.type = type;
    this.description = description;
    this.subtasks = subtasks;
    this.options = options;
    this.status = TASK_STATUS.PENDING;
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
    this.results = [];
    this.errors = [];
    this.priority = options.priority || 0;
    this.agentId = null;
  }
}

// 代理池
class AgentPool {
  constructor() {
    this.agents = new Map();
    this.loadAgents();
  }
  
  loadAgents() {
    if (!fs.existsSync(CONFIG.agentPoolDir)) {
      fs.mkdirSync(CONFIG.agentPoolDir, { recursive: true });
      return;
    }
    
    const files = fs.readdirSync(CONFIG.agentPoolDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(CONFIG.agentPoolDir, file), 'utf-8'));
        this.agents.set(data.id, data);
      } catch (e) {}
    }
  }
  
  registerAgent(agent) {
    this.agents.set(agent.id, {
      ...agent,
      lastActive: new Date().toISOString(),
      status: 'idle'
    });
    this.saveAgent(agent);
  }
  
  saveAgent(agent) {
    fs.writeFileSync(
      path.join(CONFIG.agentPoolDir, `${agent.id}.json`),
      JSON.stringify(agent, null, 2),
      'utf-8'
    );
  }
  
  getAvailableAgents() {
    return Array.from(this.agents.values()).filter(a => a.status === 'idle');
  }
  
  markBusy(agentId) {
    if (this.agents.has(agentId)) {
      this.agents.get(agentId).status = 'busy';
    }
  }
  
  markIdle(agentId) {
    if (this.agents.has(agentId)) {
      this.agents.get(agentId).status = 'idle';
      this.agents.get(agentId).lastActive = new Date().toISOString();
    }
  }
  
  getStats() {
    const agents = Array.from(this.agents.values());
    return {
      total: agents.length,
      busy: agents.filter(a => a.status === 'busy').length,
      idle: agents.filter(a => a.status === 'idle').length
    };
  }
}

// 任务分发器
class TaskDispatcher {
  constructor() {
    this.taskQueue = [];
    this.runningTasks = new Map();
    this.agentPool = new AgentPool();
    this.currentTaskIndex = 0;
  }
  
  // 创建任务
  createTask(type, description, subtasks = [], options = {}) {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return new Task(id, type, description, subtasks, options);
  }
  
  // 添加任务到队列
  enqueueTask(task) {
    this.taskQueue.push(task);
    this.saveTaskQueue();
    console.log(`✅ 任务已入队: ${task.description} (${task.id})`);
    return task;
  }
  
  // 分发策略
  dispatch(task) {
    const agents = this.agentPool.getAvailableAgents();
    
    if (agents.length === 0) {
      console.log('⚠️ 无可用代理，任务排队等待');
      return null;
    }
    
    let selectedAgent;
    
    switch (task.type) {
      case TASK_TYPES.PARALLEL:
        // 并行：选择多个代理
        selectedAgent = agents[0];
        break;
        
      case TASK_TYPES.SEQUENTIAL:
        // 顺序：使用同一个代理
        selectedAgent = agents[0];
        break;
        
      case TASK_TYPES.ROUND_ROBIN:
        // 轮询
        selectedAgent = agents[this.currentTaskIndex % agents.length];
        this.currentTaskIndex++;
        break;
        
      case TASK_TYPES.PRIORITY:
        // 优先级：选择最高优先级代理
        selectedAgent = agents.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
        break;
        
      default:
        selectedAgent = agents[0];
    }
    
    return selectedAgent;
  }
  
  // 执行任务
  async executeTask(task, agent) {
    task.status = TASK_STATUS.RUNNING;
    task.startedAt = new Date().toISOString();
    task.agentId = agent.id;
    
    this.runningTasks.set(task.id, task);
    this.agentPool.markBusy(agent.id);
    
    console.log(`🚀 开始执行任务: ${task.description}`);
    console.log(`   代理: ${agent.id}`);
    
    try {
      // 执行任务
      const result = await this.runAgentTask(agent, task);
      
      task.status = TASK_STATUS.COMPLETED;
      task.completedAt = new Date().toISOString();
      task.results.push(result);
      
      console.log(`✅ 任务完成: ${task.description}`);
      
    } catch (error) {
      task.status = TASK_STATUS.FAILED;
      task.completedAt = new Date().toISOString();
      task.errors.push(error.message);
      console.error(`❌ 任务失败: ${task.description}`, error);
    }
    
    this.agentPool.markIdle(agent.id);
    this.runningTasks.delete(task.id);
    
    return task;
  }
  
  // 运行代理任务 (模拟)
  async runAgentTask(agent, task) {
    return new Promise((resolve, reject) => {
      // 模拟任务执行
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90%成功率
          resolve({
            taskId: task.id,
            agentId: agent.id,
            output: `任务完成: ${task.description}`,
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error('模拟任务失败'));
        }
      }, 1000);
    });
  }
  
  // 协调多代理任务
  async coordinateMultiAgentTask(task) {
    if (task.subtasks.length === 0) {
      return this.enqueueTask(task);
    }
    
    console.log(`\n🤝 开始协调多代理任务: ${task.description}`);
    console.log(`   子任务数: ${task.subtasks.length}`);
    
    const results = [];
    
    switch (task.type) {
      case TASK_TYPES.PARALLEL:
        // 并行执行所有子任务
        const promises = task.subtasks.map(subtask => {
          const agentTask = this.createTask(
            TASK_TYPES.PARALLEL,
            subtask,
            [],
            { parentTask: task.id }
          );
          const agent = this.dispatch(agentTask);
          if (agent) {
            return this.executeTask(agentTask, agent);
          }
          return Promise.reject(new Error('无可用代理'));
        });
        
        results.push(...await Promise.all(promises));
        break;
        
      case TASK_TYPES.SEQUENTIAL:
        // 顺序执行
        for (const subtask of task.subtasks) {
          const agentTask = this.createTask(
            TASK_TYPES.SEQUENTIAL,
            subtask,
            [],
            { parentTask: task.id }
          );
          const agent = this.dispatch(agentTask);
          if (agent) {
            const result = await this.executeTask(agentTask, agent);
            results.push(result);
          }
        }
        break;
        
      default:
        // 默认并行
        const defaultPromises = task.subtasks.map(subtask => {
          const agentTask = this.createTask(TASK_TYPES.PARALLEL, subtask, []);
          const agent = this.dispatch(agentTask);
          if (agent) {
            return this.executeTask(agentTask, agent);
          }
        });
        results.push(...await Promise.all(defaultPromises));
    }
    
    task.results = results;
    task.status = TASK_STATUS.COMPLETED;
    task.completedAt = new Date().toISOString();
    
    return task;
  }
  
  // 聚合结果
  aggregateResults(task) {
    const aggregated = {
      taskId: task.id,
      description: task.description,
      status: task.status,
      completedAt: task.completedAt,
      resultCount: task.results.length,
      errorCount: task.errors.length,
      results: task.results.map(r => r.output || r),
      errors: task.errors
    };
    
    this.saveResults(aggregated);
    return aggregated;
  }
  
  // 保存任务队列
  saveTaskQueue() {
    if (!fs.existsSync(CONFIG.taskQueueDir)) {
      fs.mkdirSync(CONFIG.taskQueueDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(CONFIG.taskQueueDir, 'task-queue.json'),
      JSON.stringify(this.taskQueue.map(t => ({
        id: t.id,
        type: t.type,
        description: t.description,
        status: t.status,
        priority: t.priority
      })), null, 2),
      'utf-8'
    );
  }
  
  // 保存结果
  saveResults(result) {
    if (!fs.existsSync(CONFIG.resultsDir)) {
      fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(CONFIG.resultsDir, `result-${result.taskId}.json`),
      JSON.stringify(result, null, 2),
      'utf-8'
    );
    
    console.log(`💾 结果已保存: result-${result.taskId}.json`);
  }
  
  // 获取状态
  getStatus() {
    return {
      queueLength: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      agentStats: this.agentPool.getStats()
    };
  }
}

// 冲突解决策略
class ConflictResolver {
  static RESOLUTION_STRATEGIES = {
    OVERWRITE: 'overwrite',     // 覆盖
    MERGE: 'merge',             // 合并
    NEWEST: 'newest',           // 最新
    OLDEST: 'oldest',           // 最旧
    MANUAL: 'manual'            // 手动解决
  };
  
  static resolve(conflicts, strategy = this.RESOLUTION_STRATEGIES.NEWEST) {
    const resolved = [];
    
    for (const conflict of conflicts) {
      switch (strategy) {
        case this.RESOLUTION_STRATEGIES.OVERWRITE:
          resolved.push(conflict.latest || conflict.newest);
          break;
          
        case this.RESOLUTION_STRATEGIES.MERGE:
          resolved.push(this.merge(conflict));
          break;
          
        case this.RESOLUTION_STRATEGIES.NEWEST:
          resolved.push(conflict.newest || conflict.latest);
          break;
          
        case this.RESOLUTION_STRATEGIES.OLDEST:
          resolved.push(conflict.oldest);
          break;
          
        case this.RESOLUTION_STRATEGIES.MANUAL:
          resolved.push({ needsManual: true, conflict });
          break;
      }
    }
    
    return resolved;
  }
  
  static merge(conflict) {
    return {
      merged: true,
      sources: conflict.sources,
      timestamp: new Date().toISOString(),
      content: [...new Set(conflict.sources.map(s => s.content))]
    };
  }
}

// 创建全局调度器实例
const dispatcher = new TaskDispatcher();

// 注册默认代理
dispatcher.agentPool.registerAgent({
  id: 'agent-coder',
  name: '编程助手',
  capabilities: ['coding', 'debugging', 'code-review'],
  status: 'idle'
});

dispatcher.agentPool.registerAgent({
  id: 'agent-writer',
  name: '写作助手',
  capabilities: ['writing', 'summarizing', 'translation'],
  status: 'idle'
});

dispatcher.agentPool.registerAgent({
  id: 'agent-researcher',
  name: '研究助手',
  capabilities: ['research', 'analysis', 'data-processing'],
  status: 'idle'
});

// 导出
module.exports = {
  dispatcher,
  TaskDispatcher,
  AgentPool,
  ConflictResolver,
  TASK_STATUS,
  TASK_TYPES
};

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'status') {
    console.log('\n🤖 多代理协作系统状态\n');
    console.log(JSON.stringify(dispatcher.getStatus(), null, 2));
  } else if (args[0] === 'agents') {
    console.log('\n👥 代理池\n');
    console.log(JSON.stringify(dispatcher.agentPool.getStats(), null, 2));
  } else if (args[0] === 'dispatch') {
    // 分发任务
    const task = dispatcher.createTask(
      TASK_TYPES.PARALLEL,
      args.slice(2).join(' ') || '测试任务',
      ['子任务1', '子任务2', '子任务3']
    );
    dispatcher.enqueueTask(task);
  } else if (args[0] === 'run') {
    // 运行任务
    const task = dispatcher.createTask(
      TASK_TYPES.ROUND_ROBIN,
      args.slice(2).join(' ') || '测试任务',
      ['任务A', '任务B', '任务C']
    );
    dispatcher.coordinateMultiAgentTask(task).then(t => {
      console.log('\n✨ 任务完成');
      console.log(JSON.stringify(dispatcher.aggregateResults(t), null, 2));
    });
  } else {
    console.log('用法:');
    console.log('  node task-dispatcher.js status  - 查看系统状态');
    console.log('  node task-dispatcher.js agents  - 查看代理池');
    console.log('  node task-dispatcher.js dispatch <任务名> - 分发任务');
    console.log('  node task-dispatcher.js run <任务名> - 执行多代理任务');
  }
}
