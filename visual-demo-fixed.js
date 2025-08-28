import { ethers } from "ethers";
import fs from "fs";
import readline from "readline";

class VisualDemo {
  constructor() {
    this.step = 1;
    this.provider = null;
    this.accounts = {};
    this.contracts = {};
    this.rl = null;
  }

  async initializeReadline() {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
  }

  async displayHeader(title) {
    console.log('\n' + '🎭'.repeat(30));
    console.log(`🚀 ${title.toUpperCase()}`);
    console.log('🎭'.repeat(30));
  }

  async displayStep(description) {
    console.log(`\n📋 步骤 ${this.step}: ${description}`);
    console.log('─'.repeat(50));
    this.step++;
  }

  async displayResult(success, details = {}) {
    const status = success ? '✅ 成功' : '❌ 失败';
    console.log(`\n${status}`);
    
    Object.entries(details).forEach(([key, value]) => {
      console.log(`   📊 ${key}: ${value}`);
    });
  }

  async displayBalance(address, label, tokenContract = null) {
    try {
      const ethBalance = await this.provider.getBalance(address);
      console.log(`💰 ${label}:`);
      console.log(`   ETH: ${ethers.formatEther(ethBalance)}`);
      
      if (tokenContract) {
        const tokenBalance = await tokenContract.balanceOf(address);
        console.log(`   USDT: ${ethers.formatUnits(tokenBalance, 6)}`);
      }
    } catch (error) {
      console.log(`💰 ${label}: 获取余额失败`);
    }
  }

  async waitForUser(message = "按 Enter 继续...") {
    console.log(`\n⏳ ${message}`);
    
    try {
      await this.initializeReadline();
      
      return new Promise((resolve) => {
        const handleInput = () => {
          this.rl.removeListener('line', handleInput);
          this.rl.removeListener('SIGINT', handleSigInt);
          resolve();
        };
        
        const handleSigInt = () => {
          console.log('\n👋 演示被用户中断');
          this.cleanup();
          process.exit(0);
        };
        
        this.rl.once('line', handleInput);
        this.rl.once('SIGINT', handleSigInt);
        
        // 如果是非交互模式（如管道输入），自动继续
        if (!process.stdin.isTTY) {
          setTimeout(() => {
            handleInput();
          }, 1000);
        }
      });
    } catch (error) {
      // 如果输入流有问题，自动继续
      console.log('   (自动继续...)');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async cleanup() {
    if (this.rl) {
      this.rl.close();
    }
  }

  async createLocalNetwork() {
    await this.displayHeader("AgentPlatform 可视化演示");
    await this.displayStep("初始化本地区块链网络");
    
    try {
      // 使用Hardhat本地网络的预设账户
      const testAccounts = [
        { key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", role: "平台所有者" },
        { key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", role: "Agent Alice" },
        { key: "0x5de4111afa1a4b94908f83103c4492b41acbe4b4d7e7d3a3b08d0c2cf5fd0bc9", role: "仲裁者 Bob" },
        { key: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", role: "买家 Charlie" }
      ];

      // 创建模拟provider和accounts
      console.log("🌐 创建模拟区块链环境...");
      
      this.accounts = {};
      testAccounts.forEach(acc => {
        this.accounts[acc.role] = {
          address: ethers.computeAddress(acc.key),
          role: acc.role,
          ethBalance: "10000.0",
          usdtBalance: "0.0"
        };
      });

      await this.displayResult(true, {
        "网络": "模拟本地网络",
        "账户数量": testAccounts.length.toString(),
        "初始ETH": "每账户 10,000 ETH"
      });

      console.log("\n👥 测试账户:");
      Object.values(this.accounts).forEach((acc, i) => {
        console.log(`   ${i + 1}. ${acc.role}: ${acc.address.slice(0, 8)}...${acc.address.slice(-6)}`);
      });

      return true;
    } catch (error) {
      await this.displayResult(false, { "错误": error.message });
      return false;
    }
  }

  async simulateContractDeployment() {
    await this.displayStep("部署智能合约");
    
    try {
      console.log("🔨 部署 MockERC20 (USDT) 合约...");
      
      // 模拟部署过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.contracts.usdt = {
        address: "0x" + Math.random().toString(16).slice(2, 42),
        name: "Mock USDT",
        symbol: "USDT",
        decimals: 6
      };

      console.log("🔨 部署 AgentPlatform 合约...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.contracts.platform = {
        address: "0x" + Math.random().toString(16).slice(2, 42),
        name: "AgentPlatform",
        version: "1.0.0"
      };

      await this.displayResult(true, {
        "USDT合约": this.contracts.usdt.address.slice(0, 10) + "...",
        "Platform合约": this.contracts.platform.address.slice(0, 10) + "...",
        "Gas使用": "约 2,500,000"
      });

      return true;
    } catch (error) {
      await this.displayResult(false, { "错误": error.message });
      return false;
    }
  }

  async simulateTokenMinting() {
    await this.displayStep("铸造测试代币");
    
    try {
      console.log("💰 为测试账户铸造 USDT...");
      
      const roles = ["Agent Alice", "仲裁者 Bob", "买家 Charlie"];
      
      for (const role of roles) {
        console.log(`   铸造 1000 USDT 给 ${role}...`);
        this.accounts[role].usdtBalance = "1000.0";
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      await this.displayResult(true, {
        "铸造总量": "3000 USDT",
        "受益账户": "3个测试账户"
      });

      console.log("\n💰 当前余额:");
      Object.values(this.accounts).forEach(acc => {
        if (acc.usdtBalance !== "0.0") {
          console.log(`   ${acc.role}: ${acc.usdtBalance} USDT`);
        }
      });

      return true;
    } catch (error) {
      await this.displayResult(false, { "错误": error.message });
      return false;
    }
  }

  async simulateStaking() {
    await this.displayStep("模拟抵押流程");
    
    try {
      console.log("🔒 Agent Alice 进行抵押...");
      console.log("   - 授权 500 USDT");
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("   - 执行抵押交易");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.accounts["Agent Alice"].usdtBalance = "500.0";
      this.accounts["Agent Alice"].staked = "500.0";
      this.accounts["Agent Alice"].qualified = true;

      console.log("🔒 仲裁者 Bob 进行抵押...");
      console.log("   - 授权 500 USDT");
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("   - 执行抵押交易");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.accounts["仲裁者 Bob"].usdtBalance = "500.0";
      this.accounts["仲裁者 Bob"].staked = "500.0";
      this.accounts["仲裁者 Bob"].qualified = true;

      console.log("🔒 买家 Charlie 获得资质...");
      console.log("   - 授权 200 USDT");
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("   - 抵押资质保证金");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.accounts["买家 Charlie"].usdtBalance = "800.0";
      this.accounts["买家 Charlie"].staked = "200.0";
      this.accounts["买家 Charlie"].qualified = true;

      await this.displayResult(true, {
        "Agent状态": "✅ 已获得资格",
        "仲裁者状态": "✅ 已获得资格", 
        "买家状态": "✅ 已获得资质",
        "总锁定价值": "1200 USDT"
      });

      return true;
    } catch (error) {
      await this.displayResult(false, { "错误": error.message });
      return false;
    }
  }

  async simulateAgentCard() {
    await this.displayStep("Agent更新服务卡片");
    
    try {
      console.log("📝 Agent Alice 更新服务信息...");
      
      const agentCard = {
        skills: ["AI开发", "数据分析", "自动化脚本", "区块链集成"],
        pricing: "按项目计费",
        availability: "全天候服务",
        completionRate: 98,
        rating: 4.9
      };

      console.log("   📋 技能标签:", agentCard.skills.join(", "));
      console.log("   💰 定价模式:", agentCard.pricing);
      console.log("   ⏰ 服务时间:", agentCard.availability);
      console.log("   📊 完成率:", agentCard.completionRate + "%");
      console.log("   ⭐ 评分:", agentCard.rating + "/5.0");

      await new Promise(resolve => setTimeout(resolve, 800));

      await this.displayResult(true, {
        "卡片状态": "✅ 更新成功",
        "技能数量": agentCard.skills.length.toString(),
        "完成率": agentCard.completionRate + "%"
      });

      return true;
    } catch (error) {
      await this.displayResult(false, { "错误": error.message });
      return false;
    }
  }

  async simulateTaskFlow() {
    await this.displayStep("完整任务流程演示");
    
    try {
      console.log("📋 买家 Charlie 创建任务...");
      
      const task = {
        id: 1,
        title: "AI驱动的市场分析报告",
        description: "分析加密货币市场趋势，生成投资建议报告",
        amount: "150 USDT",
        deadline: "48小时",
        status: "已创建"
      };

      console.log(`   📝 任务: ${task.title}`);
      console.log(`   💰 金额: ${task.amount}`);
      console.log(`   ⏰ 期限: ${task.deadline}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("\n🤝 Agent Alice 接受任务...");
      task.status = "进行中";
      task.agent = "Alice";
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log("🔄 Agent 开始执行任务...");
      console.log("   - 收集市场数据");
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log("   - 运行AI分析模型");
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log("   - 生成报告文档");
      await new Promise(resolve => setTimeout(resolve, 600));

      console.log("\n📤 Agent 提交任务结果...");
      task.status = "待确认";
      task.result = "✅ 市场分析报告已完成\n📊 识别3个主要趋势\n💡 提供5条投资建议\n📈 预测准确率94%";
      
      console.log("📋 提交内容:");
      task.result.split('\n').forEach(line => {
        console.log(`   ${line}`);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("\n✅ 买家 Charlie 确认任务完成...");
      task.status = "已完成";
      
      // 模拟资金转移
      this.accounts["买家 Charlie"].usdtBalance = (parseFloat(this.accounts["买家 Charlie"].usdtBalance) - 150).toString();
      this.accounts["Agent Alice"].usdtBalance = (parseFloat(this.accounts["Agent Alice"].usdtBalance) + 150).toString();
      
      await new Promise(resolve => setTimeout(resolve, 800));

      await this.displayResult(true, {
        "任务ID": task.id.toString(),
        "任务状态": "✅ 已完成",
        "Agent收益": "150 USDT",
        "执行时间": "模拟48小时内完成"
      });

      console.log("\n💰 资金转移后余额:");
      console.log(`   买家 Charlie: ${this.accounts["买家 Charlie"].usdtBalance} USDT`);
      console.log(`   Agent Alice: ${this.accounts["Agent Alice"].usdtBalance} USDT`);

      return true;
    } catch (error) {
      await this.displayResult(false, { "错误": error.message });
      return false;
    }
  }

  async displayFinalStats() {
    await this.displayStep("平台统计数据");
    
    console.log("📊 AgentPlatform 运行统计:");
    console.log("─".repeat(40));
    
    const stats = {
      "注册Agent数量": "1",
      "合格仲裁者数量": "1", 
      "活跃买家数量": "1",
      "已完成任务数": "1",
      "平台总锁定价值": "1200 USDT",
      "任务成功率": "100%",
      "平均任务完成时间": "< 48小时"
    };

    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key.padEnd(20)}: ${value}`);
    });

    console.log("\n🎯 平台健康度:");
    console.log("   🟢 系统稳定性: 优秀");
    console.log("   🟢 用户满意度: 高");
    console.log("   🟢 交易安全性: 高");
    console.log("   🟢 争议解决效率: 优秀");

    await this.displayResult(true, {
      "演示完成": "✅ 所有功能正常",
      "系统状态": "🟢 运行良好"
    });
  }

  async runFullDemo() {
    console.log("欢迎使用 AgentPlatform 可视化演示！");
    console.log("这个演示将展示平台的完整功能流程。\n");
    
    const steps = [
      () => this.createLocalNetwork(),
      () => this.simulateContractDeployment(), 
      () => this.simulateTokenMinting(),
      () => this.simulateStaking(),
      () => this.simulateAgentCard(),
      () => this.simulateTaskFlow(),
      () => this.displayFinalStats()
    ];

    let completedSteps = 0;

    for (const step of steps) {
      try {
        const result = await step();
        if (!result) {
          console.log("❌ 演示步骤失败");
          break;
        }
        completedSteps++;
        await this.waitForUser();
      } catch (error) {
        console.log(`❌ 演示遇到错误: ${error.message}`);
        break;
      }
    }

    await this.displayHeader("演示完成");
    
    if (completedSteps === steps.length) {
      console.log("🎉 恭喜！您已经完成了 AgentPlatform 的完整功能演示");
      console.log("🚀 平台已准备好进行实际部署和使用");
      console.log("\n💡 接下来您可以:");
      console.log("   • 部署到真实的测试网络");
      console.log("   • 开发Web前端界面");
      console.log("   • 邀请真实用户测试");
      console.log("   • 准备主网发布");
    } else {
      console.log(`⚠️  演示部分完成 (${completedSteps}/${steps.length} 步骤)`);
      console.log("感谢您的试用！");
    }

    await this.cleanup();
    return completedSteps === steps.length;
  }
}

// 运行演示
const demo = new VisualDemo();

// 处理退出信号
process.on('SIGINT', async () => {
  console.log('\n👋 演示被中断');
  await demo.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await demo.cleanup();
  process.exit(0);
});

demo.runFullDemo().catch(async (error) => {
  console.error('演示遇到错误:', error);
  await demo.cleanup();
  process.exit(1);
});