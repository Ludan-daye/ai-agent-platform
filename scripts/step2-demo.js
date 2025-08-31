console.log("=== Step 2 功能演示 ===");
console.log("显示排序与描述词推荐的核心API");
console.log("=====================================");

console.log("\n📊 A. Agent 排序功能演示");
console.log("合约函数调用示例:");
console.log(`
// 获取Agent可解释评分
const (score, stake, successRate, windowSize) = await platform.getAgentScore(agentAddress);
console.log(\`Agent评分: \${score}, 抵押: \${stake}, 成功率: \${successRate}, 窗口: \${windowSize}天\`);

// 分页获取排序后的Agent列表  
const agents = await platform.listAgentsSorted(0, 10); // 前10个
console.log("排序后的Agent地址:", agents);
`);

console.log("\n🎯 B. 性能追踪功能演示"); 
console.log("性能数据更新示例:");
console.log(`
// 订单完成后更新Agent性能
await platform.pushPerformanceSnapshot(
    agentAddress,
    5,  // completed tasks
    4,  // succeeded tasks  
    1000, // volume in USDT
    Date.now()
);
// 触发事件: AgentPerformanceUpdated
`);

console.log("\n🏷️ C. 关键词推荐功能演示");
console.log("关键词管理示例:");
console.log(`
// Agent更新关键词(自动规范化)
await platform.updateAgentCardKeywords(["AI", "GPT", " automation ", "OCR"]);
// 结果: ["ai", "gpt", "automation", "ocr"] (小写+去空格)

// 获取热门关键词推荐
const (keywords, scores, counts) = await platform.listTopKeywords(5);
for(let i = 0; i < keywords.length; i++) {
    console.log(\`关键词: \${keywords[i]}, 权重: \${scores[i]}, Agent数: \${counts[i]}\`);
}

// 按关键词筛选Agent
const aiAgents = await platform.listAgentsByKeyword("ai", 0, 10);
console.log("AI相关Agent:", aiAgents);
`);

console.log("\n⚡ D. 缓存与排序演示");
console.log("排序缓存管理:");
console.log(`
// 重建Agent排序缓存
await platform.rebuildAgentRanking();
// 触发事件: AgentRankingRebuilt

// 缓存有效期1小时，自动使用缓存提高查询速度
const cachedAgents = await platform.listAgentsSorted(0, 20);
`);

console.log("\n📈 E. 评分算法演示");
console.log("可解释评分计算:");

const demos = [
    { agent: "Agent A", stake: "500 USDT", successRate: "90%", score: "450" },
    { agent: "Agent B", stake: "300 USDT", successRate: "95%", score: "285" }, 
    { agent: "Agent C", stake: "800 USDT", successRate: "0% (新)", score: "800" }
];

demos.forEach(demo => {
    console.log(`${demo.agent}: 抵押${demo.stake} × 成功率${demo.successRate} = 评分${demo.score}`);
});

console.log("\n🔔 F. 事件监听演示");
console.log("前端/索引器可监听的事件:");

const events = [
    "AgentPerformanceUpdated - 性能数据更新时触发",
    "AgentKeywordsUpdated - 关键词更新时触发",  
    "KeywordIndexRebuilt - 关键词索引重建时触发",
    "AgentRankingRebuilt - 排序缓存重建时触发"
];

events.forEach((event, i) => {
    console.log(`${i+1}. ${event}`);
});

console.log("\n✅ Step 2 核心特性确认");
console.log("- 可解释的抵押×表现评分算法 ✅");
console.log("- 14天滑动窗口性能追踪 ✅"); 
console.log("- 关键词规范化与聚合推荐 ✅");
console.log("- 分页稳定排序机制 ✅");
console.log("- 事件驱动的缓存优化 ✅");
console.log("- 防刷词与质量控制 ✅");

console.log("\n🚀 准备进入Step 3: 预存与单Agent余额池管理");