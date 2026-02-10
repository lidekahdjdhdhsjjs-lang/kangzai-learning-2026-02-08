const { KangzaiSelfEvolution } = require('./self-evolution');

async function test() {
  console.log('🧠 自学习引擎测试\n');

  const engine = new KangzaiSelfEvolution();

  // 测试学习循环
  console.log('1. 测试学习循环');
  await engine.learnCycle();
  console.log('   ✅ 学习完成');

  // 测试优化循环
  console.log('\n2. 测试优化循环');
  await engine.optimizeCycle();
  console.log('   ✅ 优化完成');

  // 检查状态
  console.log('\n3. 检查状态');
  const status = await engine.getStatus();
  console.log(JSON.stringify(status, null, 2));

  console.log('\n✅ 自学习引擎测试完成!');
  console.log('\n💡 启动持续模式: node self-evolution.js start');
}

test().catch(console.error);
