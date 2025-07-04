#!/usr/bin/env node

/**
 * 环境变量设置脚本
 * 用法：node setup-env.js [environment]
 * 环境：development, test, production
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径 (ES module 兼容)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupEnvironment(env) {
  const templatePath = path.join(__dirname, 'env-templates', `${env}.env.template`);
  const envPath = path.join(__dirname, `.env.${env}`);

  // 检查模板文件是否存在
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 模板文件不存在: ${templatePath}`);
    process.exit(1);
  }

  // 检查环境变量文件是否已存在
  if (fs.existsSync(envPath)) {
    console.log(`⚠️  环境变量文件已存在: ${envPath}`);
    console.log('如需重新创建，请先删除现有文件');
    return;
  }

  try {
    // 复制模板文件
    fs.copyFileSync(templatePath, envPath);
    console.log(`✅ 已创建 ${env} 环境变量文件: ${envPath}`);
    console.log(`📝 请编辑此文件并填入真实的配置值`);
    
    // 显示需要配置的关键变量
    const content = fs.readFileSync(envPath, 'utf-8');
    const requiredVars = content.match(/^[^#\n]*_here$/gm);
    
    if (requiredVars && requiredVars.length > 0) {
      console.log(`\n🔧 需要配置的关键变量：`);
      requiredVars.forEach(line => {
        const varName = line.split('=')[0];
        console.log(`   - ${varName}`);
      });
    }
  } catch (error) {
    console.error(`❌ 创建环境变量文件失败:`, error.message);
    process.exit(1);
  }
}

function setupAllEnvironments() {
  const environments = ['development', 'test', 'production'];
  
  console.log('🚀 开始设置所有环境的环境变量文件...\n');
  
  environments.forEach(env => {
    setupEnvironment(env);
  });
  
  console.log('\n📋 接下来的步骤：');
  console.log('1. 编辑各环境的 .env.* 文件');
  console.log('2. 填入真实的数据库连接信息和 API 密钥');
  console.log('3. 使用对应的 npm 脚本启动服务：');
  console.log('   - npm run dev      (开发环境)');
  console.log('   - npm run test:run (测试环境)');
  console.log('   - npm run start:prod (生产环境)');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const environment = args[0];

  if (!environment) {
    setupAllEnvironments();
  } else if (['development', 'test', 'production'].includes(environment)) {
    setupEnvironment(environment);
  } else {
    console.error('❌ 无效的环境名称');
    console.log('支持的环境: development, test, production');
    console.log('用法: node setup-env.js [environment]');
    process.exit(1);
  }
}

main(); 