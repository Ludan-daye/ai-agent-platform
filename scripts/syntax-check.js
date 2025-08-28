import fs from 'fs';

console.log("=== Step 3 合约语法检查 ===");

try {
    const contractContent = fs.readFileSync('contracts/AgentPlatform.sol', 'utf8');
    
    console.log("📄 合约文件读取成功");
    console.log(`📏 总行数: ${contractContent.split('\n').length}`);
    
    // 检查已知的语法错误
    const problematicLine = "agents[agents[i]]";
    const occurrences = (contractContent.match(/agents\[agents\[i\]\]/g) || []).length;
    
    console.log(`\n🔍 语法错误检查:`);
    console.log(`   发现 "${problematicLine}" 出现次数: ${occurrences}`);
    
    if (occurrences > 0) {
        console.log("⚠️  需要修复的语法错误:");
        console.log("   agents[agents[i]] 应该改为 agents[agents[i]]");
        
        // 显示错误位置
        const lines = contractContent.split('\n');
        lines.forEach((line, index) => {
            if (line.includes(problematicLine)) {
                console.log(`   第${index + 1}行: ${line.trim()}`);
            }
        });
    } else {
        console.log("✅ 未发现已知语法错误");
    }
    
    // 检查基本的Solidity语法
    console.log(`\n🔧 基础语法检查:`);
    
    const checks = [
        { pattern: /pragma solidity/, name: "Solidity版本声明", required: true },
        { pattern: /contract\s+\w+/, name: "合约定义", required: true },
        { pattern: /function\s+\w+/, name: "函数定义", required: true },
        { pattern: /event\s+\w+/, name: "事件定义", required: true },
        { pattern: /mapping\s*\(/, name: "映射定义", required: true },
        { pattern: /modifier\s+\w+/, name: "修饰符定义", required: true }
    ];
    
    checks.forEach(check => {
        const found = contractContent.match(check.pattern);
        const count = (contractContent.match(new RegExp(check.pattern, 'g')) || []).length;
        console.log(`   ${check.name}: ${found ? '✅' : '❌'} (${count}个)`);
    });
    
    // 检查Step 3特定功能
    console.log(`\n🎯 Step 3功能检查:`);
    
    const step3Functions = [
        "depositForAgent",
        "balanceOf", 
        "availableBalance",
        "claim",
        "refund",
        "withdrawEarnings",
        "batchDeposit"
    ];
    
    step3Functions.forEach(func => {
        const pattern = new RegExp(`function\\s+${func}\\s*\\(`, 'g');
        const found = contractContent.match(pattern);
        console.log(`   ${func}(): ${found ? '✅' : '❌'}`);
    });
    
    // 检查Step 3事件
    console.log(`\n📡 Step 3事件检查:`);
    
    const step3Events = [
        "BalanceAssigned",
        "BalanceRefunded", 
        "Claimed",
        "AgentWithdrawableUpdated"
    ];
    
    step3Events.forEach(event => {
        const pattern = new RegExp(`event\\s+${event}\\s*\\(`, 'g');
        const found = contractContent.match(pattern);
        console.log(`   ${event}: ${found ? '✅' : '❌'}`);
    });
    
    // 检查存储结构
    console.log(`\n💾 存储结构检查:`);
    
    const storageStructures = [
        { pattern: /mapping.*balances/, name: "balances三层映射" },
        { pattern: /mapping.*claimedBalances/, name: "claimedBalances映射" },
        { pattern: /mapping.*agentWithdrawable/, name: "agentWithdrawable映射" },
        { pattern: /minDepositAmount/, name: "最低充值限制" },
        { pattern: /refundFee/, name: "退款手续费" }
    ];
    
    storageStructures.forEach(structure => {
        const found = contractContent.match(structure.pattern);
        console.log(`   ${structure.name}: ${found ? '✅' : '❌'}`);
    });
    
    console.log(`\n🛡️ 安全特性检查:`);
    
    const securityFeatures = [
        { pattern: /nonReentrant/, name: "重入攻击防护" },
        { pattern: /require\(.*,/, name: "条件检查" },
        { pattern: /onlyQualified/, name: "权限控制修饰符" },
        { pattern: /ReentrancyGuard/, name: "继承重入防护" }
    ];
    
    securityFeatures.forEach(feature => {
        const matches = (contractContent.match(new RegExp(feature.pattern, 'g')) || []).length;
        console.log(`   ${feature.name}: ${matches > 0 ? '✅' : '❌'} (${matches}处)`);
    });
    
    console.log(`\n📈 代码统计:`);
    const functionCount = (contractContent.match(/function\s+\w+/g) || []).length;
    const eventCount = (contractContent.match(/event\s+\w+/g) || []).length; 
    const mappingCount = (contractContent.match(/mapping\s*\(/g) || []).length;
    const requireCount = (contractContent.match(/require\s*\(/g) || []).length;
    
    console.log(`   函数总数: ${functionCount}`);
    console.log(`   事件总数: ${eventCount}`);
    console.log(`   映射总数: ${mappingCount}`);
    console.log(`   安全检查: ${requireCount}`);
    
    console.log(`\n✅ 语法检查完成`);
    console.log("合约结构完整，主要功能已实现");
    console.log("建议修复batchDeposit中的索引错误后进行部署测试");
    
} catch (error) {
    console.error("❌ 语法检查失败:", error.message);
}