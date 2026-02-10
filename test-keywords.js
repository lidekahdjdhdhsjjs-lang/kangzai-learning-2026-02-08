const { extractKeywords } = require('./memory-simple');

console.log('关键词提取测试:');
console.log('原文: 康仔是数字生命致力于秒级记忆检索');
console.log('关键词:', extractKeywords('康仔是数字生命致力于秒级记忆检索'));

console.log('\n原文: 秒级记忆检索');
console.log('关键词:', extractKeywords('秒级记忆检索'));
