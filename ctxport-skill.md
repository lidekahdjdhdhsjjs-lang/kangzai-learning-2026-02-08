# 康仔学习系统 - ctxport技能参考

## 参考项目

**CtxPort** - https://github.com/nicepkg/ctxport

> AI对话导出工具 - 将ChatGPT/Claude/Gemini/DeepSeek等对话复制为干净的Markdown格式

## 功能概述

- 一键复制AI对话为结构化Markdown
- 支持多个AI平台
- 保留代码块、格式和元数据
- 零上传，100%本地

## 康仔实现

### 技能位置
```
OpenClaw/skills/ctxport/
├── SKILL.md           # 技能说明
├── README.md          # 使用文档
├── package.json       # 包配置
└── scripts/
    └── ctxport.js     # 核心实现
```

### 核心功能

```javascript
const { CtxPort } = require('skills/ctxport/scripts/ctxport');

const ctxport = new CtxPort();

// 导出对话为Markdown
const markdown = ctxport.generateStructuredMarkdown('chatgpt', htmlContent);

// 保存到康仔记忆系统
await ctxport.saveToMemory(htmlContent, memory, {
  type: 'conversation',
  platform: 'claude',
  tags: ['architecture']
});
```

## 支持平台

| 平台 | 状态 |
|------|------|
| ChatGPT | ✅ |
| Claude | ✅ |
| Gemini | ✅ |
| DeepSeek | ✅ |
| Grok | ⏳ |
| GitHub | ⏳ |

## 使用场景

### 1. 对话存档
将长对话保存为Markdown，便于后续检索。

### 2. 知识提炼
从对话中提取关键知识点和技术决策。

### 3. 上下文迁移
在不同AI平台间迁移对话上下文。

### 4. 康仔记忆集成
自动保存对话到康仔记忆系统，增强检索能力。

## 输出示例

```markdown
---
platform: chatgpt
date: 2026-02-10
model: gpt-4
tokens: 15000
messages: 50
---

# ChatGPT 对话导出

## 对话主题：微服务架构设计

### 用户需求
...

### AI建议
```yaml
services:
  api-gateway:
    replicas: 3
```

### 关键决策
1. 使用Kubernetes编排
2. 数据库分片策略
...
```

## 集成到康仔

在康仔中使用：

```javascript
// 保存对话到记忆
await ctxport.saveToMemory(htmlContent, memory, {
  type: 'conversation',
  platform: 'claude',
  tags: ['ai', 'design', 'architecture']
});

// 检索对话内容
const results = await memory.search('上次关于微服务的讨论');
```

## 安装依赖

```bash
npm install marked turndown
```

## 参考链接

- CtxPort原始项目: https://github.com/nicepkg/ctxport
- 康仔GitHub仓库: https://github.com/lidekahdjdhdhsjjs-lang/kangzai-learning-2026-02-08
