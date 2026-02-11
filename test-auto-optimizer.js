const { AutoOptimizer } = require('./modules/auto-optimizer');

async function test() {
  console.log('=== 测试自动优化采纳 ===\n');

  const optimizer = new AutoOptimizer();

  // 分析项目
  console.log('1. 分析项目代码');
  const analysis = await optimizer.analyzeProject();
  console.log(`   文件: ${analysis.files.length}`);
  console.log(`   分数: ${analysis.totalScore}`);
  console.log(`   建议: ${analysis.totalSuggestions}`);

  // 生成报告
  console.log('\n2. 生成优化报告');
  const report = await optimizer.generateReport();
  console.log(`   标题: ${report.title}`);
  console.log(`   建议数: ${report.recommendations.length}`);

  // 自动修复
  console.log('\n3. 自动修复可优化项');
  const fixResult = await optimizer.autoFixAll();
  console.log(`   修复: ${fixResult.fixed}个`);

  console.log('\n✅ 自动优化采纳测试完成');
}

test().catch(console.error);
