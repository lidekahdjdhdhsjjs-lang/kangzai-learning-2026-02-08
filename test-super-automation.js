const { SuperAutomation } = require('C:/Users/lidek/AppData/Roaming/npm/node_modules/openclaw/skills/super-automation/scripts/super-automation');

async function test() {
  console.log('🧠 Super Automation 测试\n');

  const auto = new SuperAutomation({ saveHistory: true });

  // 测试统计
  console.log('1. 测试统计功能');
  const stats = await auto.getStats();
  console.log('   统计:', JSON.stringify(stats, null, 2));

  // 测试命令解析
  console.log('\n2. 测试命令解析');
  const result1 = await auto.execute('打开微信');
  console.log('   打开微信:', result1.actions.length, '个动作');

  const result2 = await auto.execute('输入Hello World');
  console.log('   输入Hello:', result2.actions.length, '个动作');

  // 测试学习
  console.log('\n3. 测试学习功能');
  const learnResult = await auto.learn('测试技能', [
    { action: 'type', text: '测试' },
    { action: 'wait', ms: 500 }
  ]);
  console.log('   学习结果:', learnResult.success);

  // 测试运行技能
  console.log('\n4. 测试运行技能');
  const runResult = await auto.runSkill('测试技能');
  console.log('   运行结果: 已执行');

  // 再次检查统计
  console.log('\n5. 再次检查统计');
  const stats2 = await auto.getStats();
  console.log('   总操作数:', stats2.totalActions);
  console.log('   已学技能:', stats2.learnedSkills);

  console.log('\n✅ Super Automation 测试完成!');
}

test().catch(console.error);
