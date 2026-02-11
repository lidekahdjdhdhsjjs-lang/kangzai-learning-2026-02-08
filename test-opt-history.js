const { OptimizationHistory } = require('./modules/optimization-history');

console.log('=== 测试优化历史记录 ===\n');

const h = new OptimizationHistory();

// 添加测试记录
h.log('performance', '优化memory-simple.js关键词提取', 'memory-simple.js');
h.log('refactor', '重构extractKeywords函数', 'memory-simple.js');
h.log('cleanup', '清理TODO标记', 'self-evolution.js');

console.log('总优化:', h.getSummary().totalOptimizations);
console.log('按类型:', JSON.stringify(h.getSummary().byType));

console.log('\n=== 历史记录 ===');
const list = h.getHistory({ limit: 10 });
for (const opt of list) {
  console.log(`[${opt.type}] ${opt.description}`);
}

console.log('\n✅ 优化历史记录测试完成');
