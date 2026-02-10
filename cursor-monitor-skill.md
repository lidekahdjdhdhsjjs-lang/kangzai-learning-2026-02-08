# Cursor Monitor Skill - GitHub备份

## 技能文件

```
OpenClaw/skills/cursor-monitor/
├── SKILL.md              # 技能说明
├── README.md             # 使用文档
├── package.json          # 包配置
└── scripts/
    └── cursor-monitor.js # 核心实现
```

## 功能

| 功能 | 说明 |
|------|------|
| 文件监听 | 检测新建/修改/删除 |
| 代码分析 | 提取技术栈和模式 |
| 自动学习 | 生成学习报告 |
| 记忆集成 | 同步到康仔记忆 |

## 使用

```bash
# 扫描代码
cursor-monitor scan --path ./project

# 持续监听
cursor-monitor watch --path ./project --interval 30000

# 同步到记忆
cursor-monitor sync --memory ./memory-simple.js
```

## 测试结果

```
📄 发现 44 个代码文件
✅ 测试完成
```

## GitHub仓库

https://github.com/lidekahdjdhdhsjjs-lang/kangzai-learning-2026-02-08
