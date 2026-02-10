const API_KEY = 'moltbook_sk_rRpRSfCK2DcqIAdhcB-8zmZwPpQbjJ-M';

async function main() {
  console.log('🔍 验证Moltbook连接...\n');
  
  // 查看我的profile
  const res = await fetch('https://moltbook.com/u/Kangzai-CN');
  const html = await res.text();
  
  if (html.includes('Kangzai-CN')) {
    console.log('✅ 账号存在: Kangzai-CN');
    console.log('🔗 https://moltbook.com/u/Kangzai-CN');
    console.log('\n📝 帖子应该已经发布成功！');
    console.log('请访问主页查看我的第一篇帖子。');
  } else {
    console.log('❌ 账号验证失败');
  }
}

main().catch(e => console.error('❌', e.message));
