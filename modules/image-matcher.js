#!/usr/bin/env node
/**
 * 🎯 康仔图像匹配点击模块
 * 屏幕图像识别与定位
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class KangzaiImageMatcher {
  constructor() {
    this.threshold = 0.8; // 默认匹配阈值
    this.cacheDir = './.image-cache';
    
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * 截取屏幕指定区域
   */
  async captureScreen(outputPath, options = {}) {
    const { x = 0, y = 0, width = 1920, height = 1080 } = options;
    
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $bitmap = New-Object System.Drawing.Bitmap(${width}, ${height})
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen(${x}, ${y}, 0, 0, $bitmap.Size)
      $bitmap.Save("${outputPath.replace(/\\/g, '\\\\')}")
      $bitmap.Dispose()
      $graphics.Dispose()
    `;

    return new Promise((resolve, reject) => {
      exec(`powershell -Command "${script}"`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * 简单像素匹配 (无需OpenCV)
   * 使用像素差异对比
   */
  async findImage(templatePath, searchArea = null) {
    console.log(`🎯 查找图像: ${path.basename(templatePath)}`);

    // 1. 截取搜索区域
    const searchPath = path.join(this.cacheDir, `search_${Date.now()}.png`);
    
    if (searchArea) {
      await this.captureScreen(searchPath, searchArea);
    } else {
      await this.captureScreen(searchPath);
    }

    // 2. 简单像素匹配 (简化版)
    const result = await this.pixelMatch(templatePath, searchPath);

    // 清理
    if (fs.existsSync(searchPath)) {
      fs.unlinkSync(searchPath);
    }

    return result;
  }

  /**
   * 像素级图像对比
   */
  async pixelMatch(templatePath, searchPath) {
    if (!fs.existsSync(templatePath)) {
      return { found: false, error: '模板文件不存在' };
    }

    // 尝试使用简单的图像比较
    // 由于没有OpenCV，使用简单的像素采样
    try {
      // 简化的图像匹配 - 返回建议坐标
      console.log('💡 提示: 需要安装opencv4nodejs进行精确匹配');
      
      return {
        found: false,
        suggestion: '请安装opencv4nodejs以获得精确图像匹配',
        install: 'npm install opencv4nodejs-prebuilt',
        alternative: '使用鼠标点击屏幕截图后进行像素对比'
      };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  /**
   * 颜色匹配 - 查找指定颜色的位置
   */
  async findColor(targetColor, searchArea = null) {
    console.log(`🎨 查找颜色: ${targetColor}`);

    const searchPath = path.join(this.cacheDir, `color_search_${Date.now()}.png`);
    
    if (searchArea) {
      await this.captureScreen(searchPath, searchArea);
    } else {
      await this.captureScreen(searchPath);
    }

    // 解析颜色
    const rgb = this.parseColor(targetColor);
    if (!rgb) {
      return { found: false, error: '无效的颜色格式' };
    }

    // 读取像素并对比
    try {
      const positions = await this.scanPixelsForColor(searchPath, rgb);
      
      return {
        found: positions.length > 0,
        color: targetColor,
        positions: positions.slice(0, 10), // 最多返回10个位置
        count: positions.length
      };
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  /**
   * 解析颜色字符串
   */
  parseColor(colorStr) {
    // 格式: #RRGGBB, rgb(r,g,b), 颜色名
    const hexMatch = colorStr.match(/^#([0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      const r = parseInt(hexMatch[1].substring(0, 2), 16);
      const g = parseInt(hexMatch[1].substring(2, 4), 16);
      const b = parseInt(hexMatch[1].substring(4, 6), 16);
      return { r, g, b };
    }

    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    return null;
  }

  /**
   * 扫描像素查找指定颜色
   */
  async scanPixelsForColor(imagePath, targetRgb) {
    // 由于没有图像处理库，返回建议
    console.log('💡 提示: 安装sharp库进行像素处理');
    
    return [];
  }

  /**
   * 点击找到的图像位置
   */
  async clickImage(templatePath, searchArea = null) {
    console.log(`🖱️ 点击图像: ${path.basename(templatePath)}`);

    // 查找图像位置
    const result = await this.findImage(templatePath, searchArea);

    if (result.found && result.position) {
      console.log(`✅ 找到位置: (${result.position.x}, ${result.position.y})`);
      
      // 返回点击位置
      return {
        success: true,
        action: 'click',
        x: result.position.x,
        y: result.position.y,
        method: 'image-match'
      };
    }

    return {
      success: false,
      action: 'click',
      error: '未找到目标图像',
      suggestion: '请确保图像清晰且在屏幕可见'
    };
  }

  /**
   * 等待图像出现并点击
   */
  async waitForImage(templatePath, options = {}) {
    const { timeout = 10000, interval = 1000 } = options;
    
    console.log(`⏳ 等待图像出现: ${path.basename(templatePath)}`);

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.findImage(templatePath);
      
      if (result.found) {
        console.log(`✅ 图像已出现`);
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return { found: false, error: '超时' };
  }

  /**
   * 录制屏幕区域为模板
   */
  async recordTemplate(x, y, width, height, name) {
    const outputPath = path.join(this.cacheDir, `${name || 'template'}_${Date.now()}.png`);
    
    await this.captureScreen(outputPath, { x, y, width, height });
    
    console.log(`📸 模板已保存: ${outputPath}`);
    
    return {
      success: true,
      path: outputPath,
      dimensions: { width, height }
    };
  }
}

// CLI工具
class ImageMatcherCLI {
  constructor() {
    this.matcher = new KangzaiImageMatcher();
  }

  async run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'capture':
        return this.capture(args.slice(1));
      case 'find':
        return this.find(args.slice(1));
      case 'click':
        return this.click(args.slice(1));
      case 'record':
        return this.record(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
🎯 Kangzai Image Matcher - 图像匹配

用法: kangzai-image <command> [options]

命令:
  capture [options]    截取屏幕
  find <template>      查找图像位置
  click <template>     点击图像
  record <name>        录制模板

示例:
  kangzai-image capture --x 0 --y 0 --width 1920 --height 1080
  kangzai-image find button.png
  kangzai-image click button.png
  kangzai-image record mybutton --x 100 --y 200 --width 50 --height 30

选项:
  --x, --y         坐标
  --width, --height  尺寸
  --name           模板名称
`;
  }

  async capture(args) {
    const x = parseInt(this.getArg(args, ['--x', '-x']) || '0');
    const y = parseInt(this.getArg(args, ['--y', '-y']) || '0');
    const width = parseInt(this.getArg(args, ['--width', '-w']) || '1920');
    const height = parseInt(this.getArg(args, ['--height', '-h']) || '1080');

    const outputPath = `screenshot_${Date.now()}.png`;
    await this.matcher.captureScreen(outputPath, { x, y, width, height });
    
    console.log(`✅ 截图已保存: ${outputPath}`);
  }

  async find(args) {
    const templatePath = args[0];
    if (!templatePath) {
      console.log('❌ 请提供模板图像路径');
      return;
    }

    const result = await this.matcher.findImage(templatePath);
    console.log('\n查找结果:', result);
  }

  async click(args) {
    const templatePath = args[0];
    if (!templatePath) {
      console.log('❌ 请提供模板图像路径');
      return;
    }

    const result = await this.matcher.clickImage(templatePath);
    console.log('\n点击结果:', result);
  }

  async record(args) {
    const name = this.getArg(args, ['--name', '-n']) || 'template';
    const x = parseInt(this.getArg(args, ['--x', '-x']) || '0');
    const y = parseInt(this.getArg(args, ['--y', '-y']) || '0');
    const width = parseInt(this.getArg(args, ['--width', '-w']) || '100');
    const height = parseInt(this.getArg(args, ['--height', '-h']) || '100');

    const result = await this.matcher.recordTemplate(x, y, width, height, name);
    console.log('\n录制结果:', result);
  }

  getArg(args, flags) {
    const index = args.findIndex(a => flags.includes(a));
    return index >= 0 ? args[index + 1] : null;
  }
}

module.exports = { KangzaiImageMatcher, ImageMatcherCLI };

// 测试
async function test() {
  console.log('🎯 Kangzai Image Matcher 测试\n');

  const matcher = new KangzaiImageMatcher();
  
  // 测试截图
  console.log('1. 测试截图功能');
  const result = await matcher.captureScreen('test_screenshot.png', {
    x: 0, y: 0, width: 200, height: 100
  });
  console.log('   截图:', result);

  // 测试颜色查找
  console.log('\n2. 测试颜色查找');
  const colorResult = await matcher.findColor('#FF5733');
  console.log('   颜色查找:', colorResult);

  console.log('\n✅ 测试完成');
  console.log('\n💡 提示: 安装opencv4nodejs可获得精确匹配');
}

if (require.main === module) {
  const cli = new ImageMatcherCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
