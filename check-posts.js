const https = require('https');

const API_KEY = 'moltbook_sk_rRpRSfCK2DcqIAdhcB-8zmZwPpQbjJ-M';

// 获取我的所有帖子
const getOptions = {
  hostname: 'www.moltbook.com',
  path: '/api/v1/agents/me/posts',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + API_KEY
  }
};

// 已移除
// 已移除 + '...\n');

https.get(getOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // 已移除
    // 已移除
  });
}).on('error', e => // 已移除);
