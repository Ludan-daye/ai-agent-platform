#!/bin/bash

# AgentPlatform 一键全自动化测试脚本
# 包含链条初始化、用户场景、AgentCard可视化和完整测试流程

echo "🚀 AgentPlatform 一键全自动化测试"
echo "=================================="

# 检查环境
echo "🔍 检查测试环境..."

# 检查Node.js版本
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js版本: $NODE_VERSION"
else
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查项目文件
if [ ! -f "comprehensive-auto-test.js" ]; then
    echo "❌ 测试文件不存在"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json不存在"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 显示测试信息
echo "📋 测试内容概览:"
echo "├── 🔧 区块链环境初始化"
echo "├── 🏗️ 智能合约部署 (USDT + AgentPlatform)"
echo "├── 💰 代币分发和抵押机制"
echo "├── 👤 Agent注册和资料展示"
echo "├── 📝 任务创建场景 (Client视角)"
echo "├── 🤝 任务接受场景 (Agent视角)"
echo "├── 💼 任务执行模拟 (AgentCard可视化)"
echo "├── ✅ 任务验收和评价"
echo "├── 💸 资金结算和支付"
echo "├── ⚖️ 争议处理场景模拟"
echo "└── 📊 平台运营统计总结"
echo ""

echo "🎭 角色设定:"
echo "├── 👨‍💼 Alice (Client) - 任务委托方"
echo "├── 🤖 Bob (Agent) - AI代理方"  
echo "├── ⚖️ Charlie (Arbitrator) - 仲裁者"
echo "└── 🏢 Platform - 平台管理方"
echo ""

echo "🎯 AgentCard类型:"
echo "├── 📊 数据分析专家 (主要测试)"
echo "├── 🌐 多语言翻译专家 (争议场景)"
echo "└── 💻 智能合约开发者 (展示用)"
echo ""

# 询问用户是否继续
echo "⚠️  注意: 测试将运行约30-60秒，包含详细的可视化输出"
echo ""
read -p "🎬 按Enter开始全自动化测试，或Ctrl+C退出: " -r

echo ""
echo "🚦 测试开始..."
echo "=================================================="

# 设置输出缓冲
export NODE_NO_WARNINGS=1

# 运行主测试
node comprehensive-auto-test.js

TEST_EXIT_CODE=$?

echo ""
echo "=================================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 全自动化测试成功完成！"
    echo ""
    echo "📄 测试结果文件:"
    
    if [ -f "comprehensive-test-report.json" ]; then
        echo "✅ comprehensive-test-report.json - 详细测试报告"
        
        # 显示简要统计
        echo ""
        echo "📊 测试统计摘要:"
        echo "$(node -e "
            const report = JSON.parse(require('fs').readFileSync('comprehensive-test-report.json', 'utf8'));
            console.log('总测试场景:', report.totalScenarios);
            console.log('成功场景:', report.successfulScenarios);  
            console.log('失败场景:', report.failedScenarios);
            console.log('成功率:', report.successRate + '%');
            console.log('测试时长:', report.duration + '秒');
        " 2>/dev/null)"
    fi
    
    echo ""
    echo "🔗 相关文件:"
    echo "├── 📋 basic-verification.js - 环境验证脚本"
    echo "├── 🎬 comprehensive-auto-test.js - 完整测试脚本"  
    echo "├── 📊 comprehensive-test-report.json - 测试报告"
    echo "└── 🚀 run-comprehensive-test.sh - 一键启动脚本"
    
    echo ""
    echo "💡 下一步建议:"
    echo "1. 查看测试报告: cat comprehensive-test-report.json | jq"
    echo "2. 启动真实网络: npx hardhat node (需先安装依赖)"
    echo "3. 部署到测试网: 修改hardhat.config.js"
    echo "4. 前端集成: 使用生成的合约ABI"
    
else
    echo "❌ 测试过程中遇到错误 (退出码: $TEST_EXIT_CODE)"
    echo ""
    echo "🔧 排查建议:"
    echo "1. 检查Node.js版本是否兼容 (推荐v18+)"
    echo "2. 确保所有必要文件存在"
    echo "3. 查看上方错误信息进行调试"
    echo "4. 运行基础验证: node basic-verification.js"
fi

echo ""
echo "📞 如有问题，请查看详细日志或联系开发团队"
echo "🎯 AgentPlatform - 让AI代理服务更加透明和可信！"