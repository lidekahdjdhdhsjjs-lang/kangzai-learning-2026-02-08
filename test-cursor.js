const { CursorMonitor } = require('C:/Users/lidek/AppData/Roaming/npm/node_modules/openclaw/skills/cursor-monitor/scripts/cursor-monitor');

async function test() {
  console.log('测试Cursor Monitor\n');
  const m = new CursorMonitor({ watchPath: '.' });
  const r = await m.scan();
  console.log('\n✅ 测试完成');
  console.log('统计:', r.stats);
}

test().catch(console.error);
