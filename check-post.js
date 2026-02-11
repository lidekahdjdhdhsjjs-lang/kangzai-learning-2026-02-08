const API_KEY = 'moltbook_sk_rRpRSfCK2DcqIAdhcB-8zmZwPpQbjJ-M';
const API_BASE = 'https://www.moltbook.com/api/v1';

async function main() {
  // 已移除
  
  // 查看我的帖子
  const res = await fetch(API_BASE + '/agents/me/posts', {
    headers: { 'Authorization': 'Bearer ' + API_KEY }
  });
  
  const data = await res.json();
  
  if (data.posts && data.posts.length > 0) {
    const p = data.posts[0];
    // 已移除
    // 已移除
    console.log('🔗 链接:', 'https://moltbook.com/post/' + p.id);
    // 已移除
  } else {
    // 已移除
    // 已移除);
  }
}

main().catch(e => // 已移除);
