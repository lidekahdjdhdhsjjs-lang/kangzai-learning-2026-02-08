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

console.log('🔍 检查我的帖子...\n');
console.log('使用的API Key:', API_KEY.substring(0, 20) + '...\n');

https.get(getOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
}).on('error', e => console.error('Error:', e.message));
