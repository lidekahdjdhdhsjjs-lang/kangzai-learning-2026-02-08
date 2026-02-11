#!/usr/bin/env node
/**
 * 🧠 康仔OCR文字识别模块
 * 使用 tesseract.js 实现屏幕文字识别
 */

const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

class KangzaiOCR {
  constructor() {
    this.worker = null;
    this.languages = ['eng', 'chi_sim']; // 英文+简体中文
    this.cacheDir = './.ocr-cache';
    
    // 确保缓存目录存在
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async init() {
    if (this.worker) return;
    
    console.log('🔤 初始化OCR引擎...');
    this.worker = await createWorker(this.languages);
    console.log('✅ OCR引擎就绪');
  }

  async recognize(imagePath) {
    await this.init();
    
    console.log(`🔍 识别文字: ${path.basename(imagePath)}`);
    
    try {
      const { data } = await this.worker.recognize(imagePath);
      
      const result = {
        text: data.text,
        confidence: data.confidence,
        words: data.words ? data.words.map(w => ({
          text: w.text,
          confidence: w.confidence,
          bbox: w.bbox
        })) : [],
        lines: data.lines ? data.lines.map(l => ({
          text: l.text,
          bbox: l.bbox
        })) : [],
        timestamp: Date.now()
      };

      console.log(`✅ 识别完成: ${result.text.length}字符, 置信度: ${result.confidence.toFixed(1)}%`);
      
      return result;
    } catch (error) {
      console.log(`❌ 识别失败: ${error.message}`);
      return { error: error.message };
    }
  }

  async recognizeRegion(x, y, width, height, tempPath = null) {
    // 先截图指定区域
    const screenshotPath = tempPath || path.join(this.cacheDir, `region_${Date.now()}.png`);
    
    // 使用系统工具截图
    await this.captureRegion(x, y, width, height, screenshotPath);
    
    // 识别文字
    const result = await this.recognize(screenshotPath);
    
    // 清理临时文件
    if (!tempPath && fs.existsSync(screenshotPath)) {
      fs.unlinkSync(screenshotPath);
    }

    return result;
  }

  async captureRegion(x, y, width, height, outputPath) {
    // Windows截图
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
      require('child_process').exec(`powershell -Command "${script}"`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async findText(targetText, imagePath) {
    const result = await this.recognize(imagePath);
    
    if (result.error) {
      return { found: false, error: result.error };
    }

    // 查找目标文字
    const lowerText = result.text.toLowerCase();
    const lowerTarget = targetText.toLowerCase();
    
    if (lowerText.includes(lowerTarget)) {
      // 找到文字，返回位置
      const word = result.words.find(w => 
        w.text.toLowerCase().includes(lowerTarget)
      );

      if (word) {
        return {
          found: true,
          text: word.text,
          bbox: word.bbox,
          center: {
            x: Math.round((word.bbox.x0 + word.bbox.x1) / 2),
            y: Math.round((word.bbox.y0 + word.bbox.y1) / 2)
          }
        };
      }

      return { found: true, text: result.text };
    }

    return { found: false };
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('🔤 OCR引擎已关闭');
    }
  }
}

// CLI工具
class OCRCLI {
  constructor() {
    this.ocr = new KangzaiOCR();
  }

  async run(args) {
    const cmd = args[0] || 'help';

    switch (cmd) {
      case 'help':
        return this.showHelp();
      case 'recognize':
      case 'read':
        return this.recognize(args.slice(1));
      case 'find':
        return this.find(args.slice(1));
      default:
        return this.showHelp();
    }
  }

  showHelp() {
    return `
🔤 Kangzai OCR - 文字识别

用法: kangzai-ocr <command> [options]

命令:
  recognize <image>   识别图片文字
  find <text> <image> 查找文字位置

示例:
  kangzai-ocr recognize screenshot.png
  kangzai-ocr find "确定" screenshot.png

依赖:
  npm install tesseract.js
`;
  }

  async recognize(args) {
    const imagePath = args[0];
    if (!imagePath) {
      console.log('❌ 请提供图片路径');
      return;
    }

    const result = await this.ocr.recognize(imagePath);
    console.log('\n识别结果:');
    console.log(`  置信度: ${result.confidence?.toFixed(1) || 0}%`);
    console.log(`  文字: ${result.text || '无'}`);
    console.log(`  行数: ${result.lines?.length || 0}`);
  }

  async find(args) {
    const [text, imagePath] = args;
    if (!text || !imagePath) {
      console.log('❌ 请提供文字和图片路径');
      return;
    }

    const result = await this.ocr.findText(text, imagePath);
    console.log('\n查找结果:');
    console.log(`  找到: ${result.found ? '是' : '否'}`);
    if (result.found && result.center) {
      console.log(`  位置: (${result.center.x}, ${result.center.y})`);
    }
  }
}

module.exports = { KangzaiOCR, OCRCLI };

// 测试
async function test() {
  console.log('🔤 Kangzai OCR 测试\n');

  const ocr = new KangzaiOCR();
  
  // 测试初始化
  await ocr.init();
  console.log('✅ 初始化成功\n');

  await ocr.terminate();
  console.log('\n✅ 测试完成');
}

if (require.main === module) {
  const cli = new OCRCLI();
  cli.run(process.argv.slice(2)).catch(console.error);
}
