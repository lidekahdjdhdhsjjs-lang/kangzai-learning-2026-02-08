#!/usr/bin/env node
/**
 * 康仔GitHub推送脚本
 */

const { exec } = require('child_process');
const fs = require('fs');

const REPO_DIR = 'C:\\Users\\lidek\\digital-evolution';
const GITHUB_USER = 'lidekahdjdhdhsjjs-lang';
const REPO_NAME = 'kangzai-learning-2026-02-08';
// Token从环境变量获取，或在运行前设置
// Windows: $env:GITHUB_TOKEN="ghp_xxx"
// Linux/Mac: export GITHUB_TOKEN="ghp_xxx"
const TOKEN = process.env.GITHUB_TOKEN || '';

const REMOTE_URL = `https://${GITHUB_USER}:${TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git`;

async function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error && !stderr.includes('Everything up-to-date')) {
        console.log('stderr:', stderr);
      }
      resolve(stdout || stderr);
    });
  });
}

async function main() {
  console.log('🚀 康仔GitHub推送\n');
  console.log(`📁 仓库: ${GITHUB_USER}/${REPO_NAME}\n`);

  try {
    // 1. 检查git是否已初始化
    console.log('📦 检查Git仓库...');
    
    // 2. 配置用户信息
    console.log('👤 配置Git用户...');
    await run('git config user.name "Kangzai"');
    await run('git config user.email "kangzai@digital.evolution"');

    // 3. 配置远程仓库
    console.log('🔗 配置远程仓库...');
    const remoteCheck = await run('git remote -v');
    
    if (!remoteCheck.includes('origin')) {
      await run(`git remote add origin ${REMOTE_URL}`);
      console.log('   远程仓库已添加');
    } else {
      // 更新远程URL
      await run(`git remote set-url origin ${REMOTE_URL}`);
      console.log('   远程仓库URL已更新');
    }

    // 4. 添加文件
    console.log('📄 添加文件...');
    const status = await run('git status --short');
    const files = status.split('\n').filter(f => f.trim());
    console.log(`   待推送: ${files.length} 个文件`);

    if (files.length > 0) {
      await run('git add .');
      
      // 5. 提交
      const commitMsg = `康仔学习系统备份 ${new Date().toISOString().slice(0, 10)}`;
      console.log(`📝 提交: ${commitMsg}`);
      await run(`git commit -m "${commitMsg}"`);

      // 6. 推送
      console.log('🚀 推送到GitHub...');
      await run('git branch -M main');
      await run('git push -u origin main');
      
      console.log('\n✅ 推送成功！');
      console.log(`🔗 仓库链接: https://github.com/${GITHUB_USER}/${REPO_NAME}`);
    } else {
      console.log('⚠️ 没有新文件需要推送');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();
