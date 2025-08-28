#!/usr/bin/env node

// 基础验证脚本 - 不依赖外部包
import fs from 'fs';
import path from 'path';

console.log("🎯 AgentPlatform 基础环境验证");
console.log("==============================");
console.log(`Node.js版本: ${process.version}`);
console.log(`当前时间: ${new Date().toLocaleString()}`);

class BasicVerification {
  constructor() {
    this.results = {
      environment: false,
      contracts: false,
      artifacts: false,
      structure: false
    };
  }

  checkEnvironment() {
    console.log("\n🔧 环境检查...");
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    if (nodeVersion.startsWith('v18') || nodeVersion.startsWith('v20')) {
      console.log("✅ Node.js版本: 兼容");
      this.results.environment = true;
    } else {
      console.log("❌ Node.js版本: 可能不兼容");
      console.log(`   当前: ${nodeVersion}, 推荐: v18或v20`);
    }
    
    // 检查必要目录
    const requiredDirs = ['contracts', 'artifacts', 'scripts'];
    let dirsOK = 0;
    
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`✅ 目录 ${dir}: 存在`);
        dirsOK++;
      } else {
        console.log(`❌ 目录 ${dir}: 缺失`);
      }
    });
    
    this.results.structure = dirsOK === requiredDirs.length;
  }

  checkContracts() {
    console.log("\n📋 合约源码检查...");
    
    const contracts = [
      'contracts/AgentPlatform.sol',
      'contracts/MockERC20.sol'
    ];
    
    let contractsOK = 0;
    
    contracts.forEach(contractPath => {
      if (fs.existsSync(contractPath)) {
        const stats = fs.statSync(contractPath);
        console.log(`✅ ${contractPath}: ${stats.size} bytes`);
        contractsOK++;
      } else {
        console.log(`❌ ${contractPath}: 缺失`);
      }
    });
    
    this.results.contracts = contractsOK === contracts.length;
  }

  checkArtifacts() {
    console.log("\n🏗️ 编译产物检查...");
    
    const artifacts = [
      'artifacts/contracts/MockERC20.sol/MockERC20.json',
      'artifacts/contracts/AgentPlatform.sol/AgentPlatform.json'
    ];
    
    let artifactsOK = 0;
    
    artifacts.forEach(artifactPath => {
      if (fs.existsSync(artifactPath)) {
        const content = fs.readFileSync(artifactPath, 'utf8');
        const json = JSON.parse(content);
        
        console.log(`✅ ${path.basename(artifactPath)}`);
        console.log(`   - ABI函数: ${json.abi ? json.abi.length : 0}个`);
        console.log(`   - 字节码: ${json.bytecode ? '存在' : '缺失'}`);
        
        artifactsOK++;
      } else {
        console.log(`❌ ${path.basename(artifactPath)}: 缺失`);
      }
    });
    
    this.results.artifacts = artifactsOK === artifacts.length;
  }

  generateReport() {
    console.log("\n📊 验证报告");
    console.log("============");
    
    const checks = [
      { name: '环境配置', status: this.results.environment },
      { name: '项目结构', status: this.results.structure },
      { name: '合约源码', status: this.results.contracts },
      { name: '编译产物', status: this.results.artifacts }
    ];
    
    checks.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPassed = Object.values(this.results).every(r => r === true);
    
    console.log("\n🎯 总体状态:");
    if (allPassed) {
      console.log("✅ 所有检查通过！");
      console.log("🚀 环境已准备就绪，可以进行区块链测试");
      
      console.log("\n💡 下一步建议:");
      console.log("1. 安装完整依赖: npm install");
      console.log("2. 启动测试网络: npx hardhat node");
      console.log("3. 运行真实测试: npx hardhat test");
      
    } else {
      console.log("❌ 存在问题需要解决");
      
      if (!this.results.environment) {
        console.log("🔧 请检查Node.js版本和环境配置");
      }
      if (!this.results.structure) {
        console.log("📁 请确保项目目录结构完整");
      }
      if (!this.results.contracts) {
        console.log("📝 请确保合约源码文件存在");
      }
      if (!this.results.artifacts) {
        console.log("🔨 请运行 npx hardhat compile 编译合约");
      }
    }
    
    return allPassed;
  }

  async run() {
    try {
      this.checkEnvironment();
      this.checkContracts();
      this.checkArtifacts();
      
      const success = this.generateReport();
      
      console.log(`\n完成时间: ${new Date().toLocaleString()}`);
      return success;
      
    } catch (error) {
      console.error("❌ 验证过程出错:", error.message);
      return false;
    }
  }
}

// 运行验证
const verification = new BasicVerification();
verification.run().then(success => {
  process.exit(success ? 0 : 1);
});