# Automation Skill - GUI自动化

## 功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 🖱️ 鼠标点击 | 单击/双击/右键 | ✅ |
| ⌨️ 键盘输入 | 模拟打字 | ✅ |
| ⌨️ 快捷键 | Ctrl+C/V等 | ✅ |
| 📜 滚轮滚动 | 上下滚动 | ✅ |
| 📐 屏幕尺寸 | 获取分辨率 | ✅ |
| 📝 OCR识别 | 文字提取 | ⏳ |
| 📸 截图 | 屏幕截图 | ⏳ |

## 使用

```bash
# 点击位置
automation click --x 100 --y 200

# 输入文字
automation type --text "Hello"

# 快捷键
automation hotkey --keys ctrl c

# 滚轮滚动
automation scroll --direction down

# 获取屏幕尺寸
automation screen
```

## 跨平台

| 平台 | 状态 |
|------|------|
| Windows | ✅ |
| macOS | ⏳ |
| Linux | ⏳ |

## 文件

```
OpenClaw/skills/automation/
├── SKILL.md
├── README.md
├── package.json
└── scripts/
    └── automation.js
```

## GitHub

https://github.com/lidekahdjdhdhsjjs-lang/kangzai-learning-2026-02-08
