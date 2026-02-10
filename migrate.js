const { KangzaiMemorySimple } = require('./memory-simple');
const fs = require('fs');

async function migrate() {
  console.log('=== Memory Migration ===\n');
  const mem = new KangzaiMemorySimple();
  
  console.log('Current memories:', mem.memories.length);
  
  // Migrate daily files
  const dailyDir = 'C:\\Users\\lidek\\memory\\daily';
  const files = fs.readdirSync(dailyDir).filter(f => f.startsWith('2026-02-10') && f.endsWith('.md'));
  
  console.log('Daily files found:', files.length);
  
  for (const file of files) {
    const content = fs.readFileSync(`${dailyDir}\\${file}`, 'utf8');
    const id = `daily_${file.replace('.md', '')}`;
    const exists = mem.memories.find(m => m.id === id);
    if (!exists) {
      await mem.addMemory(id, content, { type: 'daily', topic: 'learning' });
    }
  }
  
  // Core memories
  console.log('\nAdd core memories:');
  await mem.addMemory('identity', 'Kangzai is OpenClaw AI assistant, goal: second-level memory retrieval, proactive prediction, autonomous learning, real-time tech news', { type: 'identity', topic: 'core' });
  
  await mem.addMemory('vision', 'Ultimate goal: no longer waiting for instructions, but actively thinking, continuously evolving digital life', { type: 'goal', topic: 'vision' });
  
  await mem.addMemory('tech_stack', 'Tech stack: OpenClaw + Node.js + ChromaDB + Puppeteer + GitHub API', { type: 'tech', topic: 'tech' });
  
  await mem.addMemory('bing_skill', 'Bing search skill: dual engine backup (Bing+DuckDuckGo), China-friendly, auto-failover', { type: 'skill', topic: 'search' });
  
  await mem.addMemory('learning_mode', 'Learning mode: report every 30min, save to GitHub+Moltbook every 2 hours', { type: 'mode', topic: 'learning' });
  
  console.log('\nStats:', await mem.getStats());
  
  console.log('\n=== Test Search ===');
  console.log(await mem.search('digital life'));
  console.log(await mem.search('search'));
}

migrate().catch(console.error);
