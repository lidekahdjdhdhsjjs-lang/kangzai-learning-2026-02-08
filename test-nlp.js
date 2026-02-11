const { NaturalLanguageParser } = require('./modules/nlp-parser');

console.log('🧠 自然语言解析器测试\n');

const parser = new NaturalLanguageParser();
parser.loadSkillLibrary();

const testCommands = [
  '打开微信发给老板说下班了',
  '打开Chrome访问百度',
  '输入Hello World按回车',
  '滚动向下',
  '等待3秒',
  '打开记事本',
  '按Ctrl+C',
  '访问github.com',
  '点击确定按钮',
  '打开终端运行node'
];

for (const cmd of testCommands) {
  console.log(`\n📝 "${cmd}"`);
  const result = parser.parse(cmd);
  console.log(`   步骤: ${result.steps.length} | 置信度: ${(result.confidence * 100).toFixed(0)}%`);
  for (const step of result.steps) {
    console.log(`   → [${step.type}] ${step.description}`);
  }
}

console.log('\n✅ 测试完成');
