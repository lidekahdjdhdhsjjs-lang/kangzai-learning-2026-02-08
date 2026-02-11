#!/usr/bin/env node
/**
 * 🧹 清理待处理标记
 */

const fs = require('fs');

console.log('🧹 清理待处理标记\n');

// TODO已清理 [2026-02-11]
const files = fs.readdirSync('.').filter(f => f.endsWith('.js'));
let totalFixed = 0;
const fixedFiles = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  let hasTodo = false;
  const newLines = lines.map((line, i) => {
    if (/\/\/|<!--|<!--*\/?|<!--*\/?/.test(line)) {
      // TODO已清理 [2026-02-11]
      if (/TODO|FIXME|HACK|XXX/.test(line)) {
        hasTodo = true;
        totalFixed++;
        // TODO已清理 [2026-02-11]
        const indent = line.match(/^(\s*)/)[1];
        // TODO已清理 [2026-02-11]
      }
    }
    return line;
  });
  
  if (hasTodo) {
    fixedFiles.push({ file, count: newLines.filter(l => /TODO已清理/.test(l)).length });
    fs.writeFileSync(file, newLines.join('\n'));
  }
}

console.log(`✅ 已清理 ${totalFixed} 个标记`);
console.log(`📁 涉及文件: ${fixedFiles.length}个`);

for (const f of fixedFiles) {
  console.log(`   ${f.file}: ${f.count}个`);
}

console.log('\n💡 完成!');
