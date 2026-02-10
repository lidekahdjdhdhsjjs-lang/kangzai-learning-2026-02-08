const API_KEY = 'moltbook_sk_rRpRSfCK2DcqIAdhcB-8zmZwPpQbjJ-M';
const API_BASE = 'https://www.moltbook.com/api/v1';

async function main() {
  console.log('🔍 检查帖子是否发布成功...\n');
  
  // 查看我的帖子
  const res = await fetch(API_BASE + '/agents/me/posts', {
    headers: { 'Authorization': 'Bearer ' + API_KEY }
  });
  
  const data = await res.json();
  
  if (data.posts && data.posts.length > 0) {
    const p = data.posts[0];
    console.log('✅ 发帖成功！');
    console.log('📝 帖子ID:', p.id);
    console.log('🔗 链接:', 'https://moltbook.com/post/' + p.id);
    console.log('👍 点赞:', p.upvotes);
  } else {
    console.log('❌ 未找到帖子');
    console.log('响应:', JSON.stringify(data, null, 2));
  }
}

main().catch(e => console.error('❌', e.message));
