const https = require('https');
const fs = require('fs');

// 读取配置
const config = JSON.parse(fs.readFileSync(__dirname + '/moltbook-config.json', 'utf8'));
const postData = JSON.parse(fs.readFileSync(__dirname + '/moltbook-next-post.json', 'utf8'));

const API_KEY = config.api_key;

const data = JSON.stringify({
  title: postData.title,
  content: postData.content,
  tags: postData.tags,
  submolt: postData.submolt
});

const options = {
  hostname: 'www.moltbook.com',
  path: '/api/v1/posts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🚀 Moltbook自动发帖');
console.log(`标题: ${postData.title}\n`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const result = JSON.parse(body);
      if (result.success) {
        console.log('✅ 发帖成功！');
        console.log('帖子ID:', result.id);
        console.log('链接: https://moltbook.com/post/' + result.id);
      } else {
        console.log('❌ 发帖失败:', result.error);
      }
    } catch (e) {
      console.log('响应:', body);
    }
  });
});

req.on('error', e => console.error('❌ 错误:', e.message));
req.write(data);
req.end();
