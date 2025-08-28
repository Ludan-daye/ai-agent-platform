console.log("=== Step 3 功能演示 ===");
console.log("展示用户预存与单Agent余额池的完整API");
console.log("=====================================");

console.log("\n💰 A. 用户充值与绑定演示");
console.log("合约函数调用示例:");
console.log(`
// 用户为Agent充值并绑定到特定分类
const category = ethers.encodeBytes32String("api-calls");
const amount = ethers.parseUnits("100", 6); // 100 USDT

await usdtToken.connect(user).approve(platform.target, amount);
await platform.connect(user).depositForAgent(agentAddress, category, amount);

// 触发事件: BalanceAssigned(user, agent, category, amount)
`);

console.log("\n📊 B. 余额查询演示");
console.log("多维度余额查询:");
console.log(`
// 查询特定(用户-Agent-分类)的余额
const balance = await platform.balanceOf(userAddress, agentAddress, category);
console.log("总余额:", ethers.formatUnits(balance, 6), "USDT");

// 查询可用余额(扣除已claim部分)
const available = await platform.availableBalance(userAddress, agentAddress, category);
console.log("可用余额:", ethers.formatUnits(available, 6), "USDT");

// 获取详细余额信息
const details = await platform.getBalanceDetails(userAddress, agentAddress, category);
console.log("详细信息:", {
    totalDeposited: ethers.formatUnits(details.totalDeposited, 6),
    totalClaimed: ethers.formatUnits(details.totalClaimed, 6),
    availableBalance: ethers.formatUnits(details.availableBalance, 6),
    canRefund: details.canRefund
});
`);

console.log("\n💳 C. Agent扣款演示");
console.log("Agent提供服务并扣款:");
console.log(`
// Agent从用户余额扣款
const claimAmount = ethers.parseUnits("30", 6);
const reason = ethers.encodeBytes32String("api-usage-payment");

await platform.connect(agent).claim(userAddress, category, claimAmount, reason);

// 结果: 
// - 用户可用余额减少30 USDT
// - Agent可提现余额增加30 USDT
// - 触发事件: Claimed(agent, user, category, amount, reason)
`);

console.log("\n🔄 D. 用户退款演示");
console.log("退款未使用的余额:");
console.log(`
// 用户退款部分余额
const refundAmount = ethers.parseUnits("20", 6);

await platform.connect(user).refund(agentAddress, category, refundAmount);

// 结果:
// - 用户USDT余额增加20
// - 平台内余额减少20
// - 触发事件: BalanceRefunded(user, agent, category, amount, fee)
`);

console.log("\n💸 E. Agent提现演示");
console.log("Agent提现赚取的资金:");
console.log(`
// 查询Agent可提现金额
const withdrawable = await platform.getAgentWithdrawable(agentAddress);
console.log("可提现金额:", ethers.formatUnits(withdrawable, 6), "USDT");

// Agent提现
const withdrawAmount = ethers.parseUnits("25", 6);
await platform.connect(agent).withdrawEarnings(withdrawAmount);

// 结果:
// - Agent USDT余额增加25
// - Agent可提现余额减少25
`);

console.log("\n🎯 F. 资金隔离演示");
console.log("展示严格的资金隔离机制:");

const isolationDemo = [
    {
        scenario: "不同Agent隔离",
        user: "Alice", 
        agentA: "100 USDT",
        agentB: "0 USDT", 
        result: "AgentB无法使用AgentA的资金"
    },
    {
        scenario: "不同分类隔离",
        category1: "api-calls: 50 USDT",
        category2: "subscription: 30 USDT",
        result: "两个分类的资金完全独立"
    },
    {
        scenario: "已claim vs 可用",
        total: "100 USDT",
        claimed: "40 USDT", 
        available: "60 USDT",
        result: "只能退款60 USDT"
    }
];

isolationDemo.forEach((demo, i) => {
    console.log(`\n${i+1}. ${demo.scenario}:`);
    Object.entries(demo).forEach(([key, value]) => {
        if (key !== 'scenario') {
            console.log(`   ${key}: ${value}`);
        }
    });
});

console.log("\n🔢 G. 批量操作演示");
console.log("高效的批量充值操作:");
console.log(`
// 一次性向多个Agent充值
const agents = [agent1Address, agent2Address, agent3Address];
const categories = [
    ethers.encodeBytes32String("api"),
    ethers.encodeBytes32String("compute"), 
    ethers.encodeBytes32String("storage")
];
const amounts = [
    ethers.parseUnits("50", 6),
    ethers.parseUnits("75", 6),
    ethers.parseUnits("100", 6)
];

await platform.connect(user).batchDeposit(agents, categories, amounts);

// 结果: 单次交易完成三笔充值，优化gas成本
`);

console.log("\n📈 H. 完整工作流演示");
console.log("从充值到提现的完整循环:");

const workflowSteps = [
    "1️⃣ 用户充值: Alice向Agent1存入200 USDT用于API调用",
    "2️⃣ 服务提供: Agent1为Alice提供API服务",
    "3️⃣ 资金扣款: Agent1 claim 120 USDT作为服务费",
    "4️⃣ 用户退款: Alice退款剩余的80 USDT", 
    "5️⃣ Agent提现: Agent1提现赚取的120 USDT到钱包"
];

workflowSteps.forEach(step => console.log(`   ${step}`));

console.log("\n🔔 I. 事件监听演示");
console.log("前端/索引器监听的关键事件:");

const eventExamples = [
    {
        event: "BalanceAssigned",
        trigger: "用户充值时",
        data: "user, agent, category, amount"
    },
    {
        event: "Claimed", 
        trigger: "Agent扣款时",
        data: "agent, user, category, amount, reason"
    },
    {
        event: "BalanceRefunded",
        trigger: "用户退款时", 
        data: "user, agent, category, amount, fee"
    },
    {
        event: "AgentWithdrawableUpdated",
        trigger: "Agent可提现余额变化时",
        data: "agent, newBalance"
    }
];

eventExamples.forEach((example, i) => {
    console.log(`\n${i+1}. ${example.event}:`);
    console.log(`   触发时机: ${example.trigger}`);
    console.log(`   数据字段: ${example.data}`);
});

console.log("\n💡 J. 商业场景应用");
console.log("实际业务场景中的应用:");

const businessScenarios = [
    "🤖 AI API服务 - 用户预存资金，按API调用次数扣款",
    "📊 数据分析 - 按计算资源使用量和时间扣款",
    "🔒 安全审计 - 按审计深度和报告复杂度收费",
    "📝 内容生成 - 按生成内容的长度和质量收费",
    "🔍 智能搜索 - 按搜索请求数量和精度收费"
];

businessScenarios.forEach(scenario => console.log(`   ${scenario}`));

console.log("\n✅ Step 3 核心特性总结");
console.log("- 🔒 严格的资金隔离 - 每个余额池绑定单一Agent");
console.log("- 💰 灵活的分类管理 - 支持多种服务分类");
console.log("- 🛡️ 安全的扣款机制 - 硬性限制防止超额扣款");
console.log("- 🔄 完整的退款流程 - 保护用户资金安全");
console.log("- 📊 透明的余额查询 - 多维度余额信息");
console.log("- 🚀 高效的批量操作 - 优化gas成本");
console.log("- 📡 完备的事件系统 - 支持实时监控");

console.log("\n🌟 与前置步骤的集成");
console.log("🔗 Step 1 (身份资质) + Step 2 (排序推荐) + Step 3 (资金池):");
console.log("   用户根据排序选择Agent → 为选定Agent预存资金 → Agent提供服务并收费");

console.log("\n🚀 Step 3 开发完成");
console.log("完整的预存余额池系统已就绪，支持安全的资金流转操作！");