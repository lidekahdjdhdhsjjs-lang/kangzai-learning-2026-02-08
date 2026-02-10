#!/usr/bin/env node
/**
 * 康仔GitHub备份脚本
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_DIR = 'C:\\Users\\lidek\\digital-evolution';

/**
 * 初始化git仓库
 */
function initGit() {
  return new Promise((resolve, reject) => {
    exec('git init', { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error && !stderr.includes('Reinitialized')) {
        reject(error);
      } else {
        resolve('Git initialized');
      }
    });
  });
}

/**
 * 添加所有文件
 */
function addFiles() {
  return new Promise((resolve, reject) => {
    exec('git add .', { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve('Files added');
    });
  });
}

/**
 * 提交更改
 */
function commit(message) {
  return new Promise((resolve, reject) => {
    exec(`git commit -m "${message}"`, { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error && !stderr.includes('nothing to commit')) {
        reject(error);
      } else {
        resolve(stdout || 'Committed');
      }
    });
  });
}

/**
 * 检查远程仓库
 */
function checkRemote() {
  return new Promise((resolve, reject) => {
    exec('git remote -v', { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * 添加远程仓库
 */
function addRemote(url) {
  return new Promise((resolve, reject) => {
    exec(`git remote add origin ${url}`, { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error && !stderr.includes('remote origin already exists'])) {
        reject(error);
      } else {
        resolve('Remote added');
      }
    });
  });
}

/**
 * 推送到GitHub
 */
function push() {
  return new Promise((resolve, reject) => {
    exec('git push -u origin master', { cwd: REPO_DIR, timeout: 60 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * 获取仓库状态
 */
function getStatus() {
  return new Promise((resolve, reject) => {
    exec('git status --short', { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error) reject(error);
      else {
        const files = stdout.split('\n').filter(f => f.trim());
        resolve({
          files: files,
          count: files.length
        });
      }
    });
  });
}

async function main() {
  console.log('🚀 康仔GitHub备份\n');
  
  try {
    // 检查状态
    console.log('📁 检查仓库状态...');
    const status = await getStatus();
    console.log(`   待备份文件: ${status.count}`);
    
    if (status.count === 0) {
      console.log('⚠️ 没有需要备份的文件');
      return;
    }
    
    // 初始化
    console.log('\n📦 准备备份...');
    console.log('请提供GitHub仓库地址，格式如:');
    console.log('   https://github.com/用户名/仓库名.git');
    console.log('   或者 git@github.com:用户名/仓库名.git');
    console.log('\n示例: https://github.com/yourname/digital-evolution.git');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main().catch(console.error);
