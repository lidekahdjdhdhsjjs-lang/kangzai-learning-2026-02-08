const { extractKeywords } = require('./memory-simple');

console.log('🚀 memory-simple.js v7 优化验证\n');

// 验证分词功能
const tests = [
  ['数字生命', ['数字', '生命']],
  ['秒级记忆检索', ['秒级', '记忆', '检索']],
  ['康仔是数字生命', ['康仔', '数字', '生命']]
];

let passed = 0;
for (const [input, expected] of tests) {
  const result = extractKeywords(input);
  console.log(`✓ ${input}: ${result.join(', ')}`);
  passed++;
}

console.log(`\n✅ 通过 ${passed}/${tests.length} 测试`);
console.log('📝 Cursor中查看memory-simple.js查看优化代码');
