const { OperationHistoryAnalyzer } = require('./modules/operation-analyzer');
const { AutoShortcutGenerator } = require('./modules/auto-shortcut');

async function test() {
  console.log('🧪 P2模块测试\n');

  // 测试操作历史分析
  console.log('1. 测试操作历史分析');
  const analyzer = new OperationHistoryAnalyzer();
  
  // 模拟一些操作
  analyzer.record({ type: 'click', action: '确定按钮', success: true });
  analyzer.record({ type: 'click', action: '确定按钮', success: true });
  analyzer.record({ type: 'type', action: '输入文字', success: true });
  analyzer.record({ type: 'open', action: '微信', success: true });
  analyzer.record({ type: 'click', action: '发送', success: true });
  
  console.log('   记录数:', analyzer.history.operations.length);

  const analysis = analyzer.analyze({ days: 7 });
  console.log('   总操作:', analysis.totalOperations);
  console.log('   成功率:', analysis.successRate.rate);
  console.log('   类型统计:', analysis.typeStats.length);

  // 测试快捷生成
  console.log('\n2. 测试自动快捷生成');
  const shortcutGen = new AutoShortcutGenerator();
  
  // 创建快捷
  const s1 = shortcutGen.createShortcut({
    name: '打开微信',
    command: 'open WeChat',
    icon: '💬'
  });
  console.log('   快捷:', s1.name);

  // 创建宏
  const macro = {
    id: 'test_macro',
    sequence: [
      { type: 'open', action: '微信' },
      { type: 'click', action: '搜索' }
    ],
    occurrences: 3,
    suggestedName: '微信搜索'
  };
  const m1 = shortcutGen.createMacroFromPattern(macro);
  console.log('   宏:', m1.name);

  // 建议
  const suggestions = shortcutGen.suggestShortcuts([macro]);
  console.log('   建议数:', suggestions.length);

  // 报告
  console.log('\n3. 测试报告');
  const report = shortcutGen.generateReport();
  console.log('   快捷:', report.shortcuts.total);
  console.log('   宏:', report.macros.total);

  // 状态
  console.log('\n4. 状态');
  const status = shortcutGen.getStatus();
  console.log('   状态:', status);

  console.log('\n✅ P2模块测试完成');
}

test().catch(console.error);
