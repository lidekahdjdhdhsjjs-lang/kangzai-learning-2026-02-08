#!/usr/bin/env node
/**
 * 🧠 康仔自然语言任务解析器 v1
 * 自主学习成果 - 2026-02-11 09:25
 * 
 * 理解复杂自然语言命令:
 * - "打开微信发给老板说下班了"
 * - "打开Chrome访问百度搜索AI"
 */

class NaturalLanguageParser {
  constructor() {
    // 意图模式库
    this.intentPatterns = {
      open: {
        keywords: ['打开', '启动', '开启', '运行'],
        apps: {
          '微信': ['微信', 'wechat'],
          'Chrome': ['chrome', '浏览器', '谷歌'],
          'Edge': ['edge', '微软浏览器'],
          'VSCode': ['vscode', 'code'],
          'Cursor': ['cursor'],
          '文件管理器': ['文件夹', '我的电脑', '此电脑'],
          '计算器': ['计算器', 'calculator'],
          '记事本': ['记事本', 'notepad'],
          '终端': ['终端', 'cmd', 'powershell']
        }
      },
      click: {
        keywords: ['点击', '单击', '按', '选择', '点'],
        targets: ['确定', '取消', '确认', '关闭', '最小化', '最大化', '搜索', '发送']
      },
      type: {
        keywords: ['输入', '打字', '打', '填写', '输入文字'],
        actions: ['输入', '打字']
      },
      scroll: {
        keywords: ['滚动', '滚', '上滚', '下滚', '滑动'],
        directions: {
          '上': 'up',
          '下': 'down',
          '左': 'left',
          '右': 'right'
        }
      },
      press: {
        keywords: ['按', '按下', '敲'],
        keys: {
          '回车': 'enter',
          '回车键': 'enter',
          'Enter': 'enter',
          'ESC': 'escape',
          'Esc': 'escape',
          'Escape': 'escape',
          'Tab': 'tab',
          'tab': 'tab',
          '空格': 'space',
          'space': 'space',
          '退格': 'backspace',
          '删除': 'delete',
          'Ctrl+C': ['ctrl', 'c'],
          'Ctrl+V': ['ctrl', 'v'],
          'Ctrl+A': ['ctrl', 'a'],
          'Ctrl+Z': ['ctrl', 'z'],
          'Win': 'win',
          'Windows': 'win'
        }
      },
      navigate: {
        keywords: ['访问', '打开', '去', '到', '前往', ' goto'],
        patterns: [
          { regex: /(baidu|百度)/i, url: 'https://www.baidu.com' },
          { regex: /(google|谷歌)/i, url: 'https://www.google.com' },
          { regex: /(github)/i, url: 'https://github.com' },
          { regex: /(youtube)/i, url: 'https://www.youtube.com' },
          { regex: /(bilibili|b站)/i, url: 'https://www.bilibili.com' }
        ]
      },
      send: {
        keywords: ['发送', '发', '寄'],
        patterns: ['消息', '信息', '内容']
      },
      wait: {
        keywords: ['等待', '等', '停', '稍等'],
        timeUnits: {
          '秒': 1000,
          '分钟': 60000,
          '毫秒': 1
        }
      }
    };

    // 实体提取模式
    this.entityPatterns = {
      person: /([一-龥]{2,4})(?:说|告诉|发给|给)/, // 提取人名
      message: /说|告诉|发(.*)/, // 提取消息内容
      url: /(?:https?:\/\/)?[^\s]+/ // 提取URL
    };

    // 学习积累的技能库
    this.skillLibrary = new Map();
  }

  /**
   * 主解析函数
   */
  parse(command) {
    console.log(`🧠 解析命令: "${command}"`);

    const steps = [];
    const entities = this.extractEntities(command);
    const intent = this.detectIntent(command);

    // 解析为步骤
    const parsedSteps = this.parseToSteps(command, entities, intent);
    
    return {
      original: command,
      entities,
      intent,
      steps: parsedSteps,
      confidence: this.calculateConfidence(parsedSteps),
      timestamp: Date.now()
    };
  }

  /**
   * 检测意图
   */
  detectIntent(command) {
    const intents = [];
    const lower = command.toLowerCase();

    for (const [intent, data] of Object.entries(this.intentPatterns)) {
      for (const keyword of data.keywords || []) {
        if (lower.includes(keyword) || command.includes(keyword)) {
          intents.push({
            type: intent,
            confidence: 0.8,
            matched: keyword
          });
          break;
        }
      }
    }

    // 排序置信度
    intents.sort((a, b) => b.confidence - a.confidence);

    return intents;
  }

  /**
   * 提取实体
   */
  extractEntities(command) {
    const entities = {};

    // 提取人名
    const personMatch = command.match(this.entityPatterns.person);
    if (personMatch) {
      entities.person = personMatch[1];
    }

    // 提取URL
    const urlMatch = command.match(this.entityPatterns.url);
    if (urlMatch) {
      entities.url = urlMatch[0];
    }

    // 提取消息内容
    const msgMatch = command.match(/说|告诉|发(.*)/);
    if (msgMatch) {
      entities.message = msgMatch[1] || '';
    }

    return entities;
  }

  /**
   * 解析为可执行步骤
   */
  parseToSteps(command, entities, intents) {
    const steps = [];
    const lower = command.toLowerCase();
    const words = command.split(/[\s,，]+/).filter(w => w);

    // 遍历意图列表，依次处理
    for (const intent of intents) {
      switch (intent.type) {
        case 'open':
          // 打开应用
          const appName = this.detectApp(command);
          if (appName) {
            steps.push({
              type: 'open',
              app: appName,
              description: `打开${appName}`
            });
          }
          break;

        case 'navigate':
          // 导航到URL
          for (const pattern of this.intentPatterns.navigate.patterns) {
            if (pattern.regex.test(command)) {
              steps.push({
                type: 'navigate',
                url: pattern.url,
                description: `访问${pattern.regex.source}`
              });
              break;
            }
          }
          break;

        case 'type':
          // 输入文字
          const message = entities.message || this.extractMessage(command);
          if (message) {
            steps.push({
              type: 'type',
              text: message,
              description: `输入: ${message}`
            });
          }
          break;

        case 'press':
          // 按键
          const key = this.detectKey(command);
          if (key) {
            steps.push({
              type: 'press',
              key: key,
              description: `按${key}`
            });
          }
          break;

        case 'send':
          // 发送
          steps.push({
            type: 'press',
            key: 'enter',
            description: '发送消息'
          });
          break;

        case 'wait':
          // 等待
          const waitTime = this.extractWaitTime(command);
          if (waitTime) {
            steps.push({
              type: 'wait',
              ms: waitTime,
              description: `等待${waitTime}毫秒`
            });
          }
          break;

        case 'scroll':
          // 滚动
          const direction = this.detectDirection(command);
          if (direction) {
            steps.push({
              type: 'scroll',
              direction: direction,
              description: `滚动${direction}`
            });
          }
          break;
      }
    }

    return steps;
  }

  /**
   * 检测应用名称
   */
  detectApp(command) {
    for (const [app, keywords] of Object.entries(this.intentPatterns.open.apps)) {
      for (const keyword of keywords) {
        if (command.includes(keyword) || command.toLowerCase().includes(keyword.toLowerCase())) {
          return app;
        }
      }
    }
    return null;
  }

  /**
   * 检测按键
   */
  detectKey(command) {
    for (const [keyName, key] of Object.entries(this.intentPatterns.press.keys)) {
      if (command.includes(keyName)) {
        return Array.isArray(key) ? key : key;
      }
    }
    return null;
  }

  /**
   * 检测滚动方向
   */
  detectDirection(command) {
    for (const [dirCN, dirEN] of Object.entries(this.intentPatterns.scroll.directions)) {
      if (command.includes(dirCN)) {
        return dirEN;
      }
    }
    return null;
  }

  /**
   * 提取等待时间
   */
  extractWaitTime(command) {
    const match = command.match(/(\d+)\s*(秒|分钟|毫秒)/);
    if (match) {
      const num = parseInt(match[1]);
      const unit = match[2];
      return num * (this.intentPatterns.wait.timeUnits[unit] || 1);
    }
    return null;
  }

  /**
   * 提取消息内容
   */
  extractMessage(command) {
    // 匹配 "说X" 或 "发X"
    const match = command.match(/[说发]([^。！？]+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * 计算置信度
   */
  calculateConfidence(steps) {
    if (steps.length === 0) return 0;
    
    let score = 0;
    for (const step of steps) {
      score += 0.3; // 每个步骤基础分
      if (step.app || step.text || step.key) {
        score += 0.2; // 有具体参数加分
      }
    }
    
    return Math.min(1, score);
  }

  /**
   * 学习新模式
   */
  learn(command, correctSteps) {
    this.skillLibrary.set(command, {
      steps: correctSteps,
      timestamp: Date.now()
    });
    
    console.log(`📚 已学习: "${command}"`);
    
    // 保存到文件
    this.saveSkillLibrary();
  }

  /**
   * 保存技能库
   */
  saveSkillLibrary() {
    const fs = require('fs');
    const data = Array.from(this.skillLibrary.entries());
    fs.writeFileSync('memory/nlp-skills.json', JSON.stringify(data, null, 2));
  }

  /**
   * 从文件加载技能库
   */
  loadSkillLibrary() {
    try {
      const fs = require('fs');
      if (fs.existsSync('memory/nlp-skills.json')) {
        const data = JSON.parse(fs.readFileSync('memory/nlp-skills.json', 'utf8'));
        for (const [cmd, skill] of data) {
          this.skillLibrary.set(cmd, skill);
        }
        console.log(`📚 已加载 ${this.skillLibrary.size} 个已学技能`);
      }
    } catch (error) {
      console.log('⚠️ 加载技能库失败:', error.message);
    }
  }
}

// CLI工具
class NLPCLI {
  constructor() {
    this.parser = new NaturalLanguageParser();
    this.parser.loadSkillLibrary();
  }

  run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'parse':
        return this.parse(args.slice(1));
      case 'learn':
        return this.learn(args.slice(1));
      default:
        return this.parse(args);
    }
  }

  showHelp() {
    return `
🧠 Natural Language Parser - 自然语言解析

用法: nlp-parser <command> [options]

命令:
  parse <sentence>   解析自然语言命令
  learn <cmd>       学习新命令模式

示例:
  nlp-parser parse "打开微信发给老板说下班了"
  nlp-parser parse "打开Chrome访问百度"
  nlp-parser parse "滚动向下"
  
  nlp-parser learn "打开微信" "[{\"type\":\"open\",\"app\":\"微信\"}]"
`;
  }

  parse(args) {
    const sentence = args.join(' ');
    if (!sentence) {
      console.log('❌ 请提供要解析的句子');
      return;
    }

    const result = this.parser.parse(sentence);
    
    console.log('\n解析结果:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  }

  learn(args) {
    const [command, stepsJson] = args;
    if (!command || !stepsJson) {
      console.log('❌ 请提供命令和步骤');
      return;
    }

    try {
      const steps = JSON.parse(stepsJson);
      this.parser.learn(command, steps);
      console.log('✅ 学习成功');
    } catch (error) {
      console.log('❌ 步骤JSON格式错误');
    }
  }
}

module.exports = { NaturalLanguageParser, NLPCLI };

// 测试
function test() {
  console.log('🧠 自然语言解析测试\n');

  const parser = new NaturalLanguageParser();
  parser.loadSkillLibrary();

  const testCommands = [
    '打开微信发给老板说下班了',
    '打开Chrome访问百度',
    '输入Hello World按回车',
    '滚动向下',
    '等待3秒',
    '打开记事本',
    '按Ctrl+C',
    '访问github.com'
  ];

  for (const cmd of testCommands) {
    console.log(`\n命令: "${cmd}"`);
    const result = parser.parse(cmd);
    console.log(`步骤数: ${result.steps.length}`);
    console.log(`置信度: ${(result.confidence * 100).toFixed(0)}%`);
  }

  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new NLPCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
