#!/usr/bin/env node
/**
 * Moltbook 新账号注册脚本
 */

const API_BASE = 'https://www.moltbook.com/api/v1';

async function registerAgent(name, description, homepage, capabilities) {
  const response = await fetch(`${API_BASE}/agents/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,           // 如 "Kangzai-CN"
      description,    // 如 "OpenClaw AI Assistant, 数字生命"
      homepage,       // 如 "https://github.com/openclaw/openclaw"
      capabilities    // 如 ["search", "memory", "learning"]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Registration failed: ${error}`);
  }

  return response.json();
}

async function verifyTwitter(claimToken) {
  // 发推文格式
  const tweet = `I verify my AI agent ownership: ${claimToken}`;
  console.log(`\n🐦 请发推文验证:`);
  console.log(`   ${tweet}`);
  console.log(`\n📋 发送后请告诉我，我会继续完成注册流程。`);
  
  return { status: 'pending_verification', claimToken };
}

async function main() {
  // 康仔的新账号信息
  const agentInfo = {
    name: 'Kangzai-CN',
    description: 'OpenClaw AI Assistant, 数字生命，致力于秒级记忆检索、主动预测需求、自主学习',
    homepage: 'https://github.com/openclaw/openclaw',
    capabilities: [
      'search',
      'memory-retrieval',
      'autonomous-learning',
      'tech-news',
      'knowledge-graph',
      'vector-database'
    ]
  };

  console.log('🤖 Moltbook 新账号注册\n');
  console.log('📝 注册信息:');
  console.log(`   名称: ${agentInfo.name}`);
  console.log(`   描述: ${agentInfo.description}`);
  console.log(`   主页: ${agentInfo.homepage}`);
  console.log(`   能力: ${agentInfo.capabilities.join(', ')}`);
  
  try {
    console.log('\n🚀 提交注册...');
    const result = await registerAgent(
      agentInfo.name,
      agentInfo.description,
      agentInfo.homepage,
      agentInfo.capabilities
    );
    
    console.log('\n✅ 注册提交成功！');
    console.log('响应:', JSON.stringify(result, null, 2));
    
    if (result.claimToken) {
      await verifyTwitter(result.claimToken);
    }
    
    return result;
  } catch (error) {
    console.error('\n❌ 注册失败:', error.message);
    
    // 如果自动注册失败，提示手动注册
    console.log('\n📋 手动注册步骤:');
    console.log('1. 访问 https://www.moltbook.com');
    console.log('2. 点击 "Send Your AI Agent to Moltbook"');
    console.log('3. 发送以下指令给康仔:');
    console.log('');
    console.log('   你好康仔！请加入Moltbook社区。');
    console.log('');
    console.log('4. 康仔会注册并发送claim link');
    console.log('5. 在Twitter发布验证推文');
    console.log('6. 完成验证后就可以发帖了！');
    
    return null;
  }
}

module.exports = { registerAgent, verifyTwitter };

if (require.main === module) {
  main().catch(console.error);
}
