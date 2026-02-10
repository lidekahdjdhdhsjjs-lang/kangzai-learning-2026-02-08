const { KangzaiMemorySimple } = require('./memory-simple');

async function migrateMemories() {
  console.log('🔄 记忆迁移开始...\n');
  
  const mem = new KangzaiMemorySimple();
  
 现有记忆
  console.log(` // 查看📊 现有记忆: ${mem.memories.length} 条`);
  mem.memories.slice(0, 5).forEach((m, i) => {
    console.log(`  ${i+1}. [${m.metadata?.type || 'general'}] ${m.content.substring(0, 40)}...`);
  });
  
  // 迁移今日学习记录
  const fs = require('fs');
  const dailyDir = 'C:\\Users\\lidek\\memory\\daily';
  
  const files = fs.readdirSync(dailyDir).filter(f => f.startsWith('2026-02-10') && f.endsWith('.md'));
  
  console.log(`\n📁 发现今日文件: ${files.length}`);
  
  for (const file of files) {
    const content = fs.readFileSync(`${dailyDir}\\${file}`, 'utf8');
    const id = `daily_${file.replace('.md', '')}`;
    
    // 检查是否已存在
    const exists = mem.memories.find(m => m.id === id);
    if (!exists) {
      await mem.addMemory(id, content, { type: 'daily', topic: '学习记录' });
    }
  }
  
  // 添加核心记忆
  console.log('\n💉 添加核心记忆...');
  await mem.addMemory('identity_core', '康仔是OpenClaw AI助手，目标是成为秒级记忆检索、主动预测主人需求、空闲时自动学习、实时获取技术资讯的数字伙伴', { type: 'identity', topic: '核心身份' });
  
  await mem.addMemory('goal_vision', '终极目标：不再等待指令，而是主动思考、持续进化的数字生命', { type: 'goal', topic: '愿景' });
  
  await mem.addMemory('tech_stack', '技术栈：OpenClaw + Node.js + ChromaDB + Puppeteer + GitHub API', { type: 'tech', topic: '技术栈' });
  
  await mem.addMemory('skill_bing', 'Bing搜索技能：双引擎备份(Bing+DuckDuckGo)，国内网络友好，自动降级', { type: 'skill', topic: '搜索技能' });
  
  await mem.addMemory('learning_mode', '学习模式：每30分钟汇报，每2小时保存GitHub+Moltbook发帖', { type: 'mode', topic: '学习机制' });
  
  console.log('\n📈 统计信息:');
  console.log(await mem.getStats());
  
  console.log('\n✅ 迁移完成！');
  
  // 测试搜索
  console.log('\n🔍 搜索测试:');
  console.log(await mem.search('数字伙伴'));
  console.log(await mem.search('搜索'));
}

migrateMemories().catch(console.error);
