const { ErrorRecoverySystem } = require('./modules/error-recovery');

async function test() {
  console.log('🛡️ 错误恢复系统测试\n');

  const system = new ErrorRecoverySystem();

  // 测试1: 错误重试成功
  console.log('1. 测试错误重试 (3次后成功)');
  const result1 = await system.wrap(
    async (ctx) => {
      if (ctx.attempts < 2) {
        throw new Error('模拟临时错误');
      }
      return { success: true };
    },
    { name: '临时错误测试' }
  );
  console.log('   尝试次数:', result1.attempts);
  console.log('   成功:', result1.success);

  // 测试2: 达到最大重试
  console.log('\n2. 测试达到最大重试');
  const result2 = await system.wrap(
    async () => {
      throw new Error('持久错误');
    },
    { name: '持久错误测试', critical: false }
  );
  console.log('   尝试次数:', result2.attempts);
  console.log('   成功:', result2.success);

  // 测试3: 查看统计
  console.log('\n3. 查看统计');
  const stats = system.getStats();
  console.log('   总错误:', stats.totalErrors);
  console.log('   已恢复:', stats.recoveredErrors);
  console.log('   失败:', stats.failedErrors);

  // 测试4: 查看错误历史
  console.log('\n4. 查看错误历史');
  const history = system.getErrorHistory();
  console.log('   历史条数:', history.length);

  // 测试5: 生成报告
  console.log('\n5. 生成报告');
  const report = system.generateReport();
  console.log('   建议数:', report.recommendations.length);

  console.log('\n✅ 测试完成');
}

test().catch(console.error);
