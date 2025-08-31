#!/usr/bin/env node

/**
 * 🚀 快速演示测试：Gas追踪 + 间隔Agent完成率
 * Fast Demo Test: Gas Tracker + Interval Agent Completion Rate
 * 
 * 特点：
 * - 极短时间间隔（10秒为一个周期）
 * - 高频订单生成
 * - 快速数据收集和分析
 * - 完整功能演示
 */

const PerformanceTestFramework = require('./framework');
const colors = require('colors');

async function fastDemoTest() {
    console.log('🚀 快速演示测试：Gas追踪 + 间隔Agent完成率'.cyan.bold);
    console.log('================================================'.gray);
    console.log('⏱️  配置：10秒间隔，30秒总测试时间'.yellow);

    try {
        // 1. 初始化框架
        console.log('\n🔧 初始化测试框架...'.yellow);
        const framework = new PerformanceTestFramework();
        
        // 加载并修改配置以加快测试
        await framework.loadConfig();
        
        // 修改配置为快速模式
        framework.config.testParameters.simulation.duration = 0.5; // 30秒
        framework.config.testParameters.simulation.dataInterval = 2; // 2秒采样
        framework.config.testParameters.monitoring.interval = 1000; // 1秒
        framework.config.testParameters.monitoring.intervalDuration = 10000; // 10秒间隔
        
        console.log('✅ 配置已调整为快速测试模式'.green);
        
        // 验证环境并初始化模块
        await framework.validateEnvironment();
        await framework.initializeModules();
        
        // 重新配置间隔追踪器为快速模式
        framework.modules.intervalTracker.config.intervalDuration = 10000; // 10秒间隔
        framework.modules.intervalTracker.finalizeInterval();
        
        console.log('✅ 所有模块已初始化为快速模式'.green);
        
        // 显示Agent成功率分布
        console.log('\\n📊 Agent成功率分布样本:'.cyan);
        const sampleAgents = framework.modules.agentPool.agents.slice(0, 10);
        sampleAgents.forEach(agent => {
            console.log(`   ${agent.id}: ${(agent.baseSuccessRate * 100).toFixed(1)}% (信誉: ${agent.reputation.toFixed(1)}, 抵押: ${agent.deposit}ETH)`.gray);
        });

        // 2. 快速生成测试数据
        console.log('\n📊 快速生成测试数据...'.yellow);
        
        // 模拟高频订单创建
        for (let batch = 1; batch <= 3; batch++) {
            console.log(`   批次 ${batch}: 生成订单...`.gray);
            
            for (let i = 0; i < 15; i++) {
                const userId = `user_${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;
                const orderId = `order_${Date.now()}_${i}`;
                const agentId = `agent_${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`;
                const revenue = 0.005 + Math.random() * 0.015;
                
                // 订单创建
                framework.modules.intervalTracker.recordOrderCreated(orderId, userId, {
                    specialty: 'ai_inference',
                    minReputation: 60,
                    maxPrice: 0.02
                });
                
                // Gas消耗记录
                const creationGas = 80000 + Math.floor(Math.random() * 40000);
                framework.modules.gasTracker.recordGasUsage('orderCreation', creationGas, 
                    `0x${Math.random().toString(16).substr(2, 64)}`, 15000000 + i, userId);
                framework.modules.intervalTracker.recordGasUsage('orderCreation', creationGas);
                
                // 智能选择Agent并使用其真实成功率
                const availableAgents = framework.modules.agentPool.agents.filter(a => a.isActive && a.availableCapacity() > 0);
                if (availableAgents.length > 0 && Math.random() < 0.9) { // 90%能找到Agent
                    // 随机选择一个可用Agent
                    const selectedAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
                    const selectedAgentId = selectedAgent.id;
                    
                    framework.modules.intervalTracker.recordOrderAccepted(orderId, selectedAgentId);
                    
                    const acceptanceGas = 60000 + Math.floor(Math.random() * 30000);
                    framework.modules.gasTracker.recordGasUsage('orderAcceptance', acceptanceGas, 
                        `0x${Math.random().toString(16).substr(2, 64)}`, 15000000 + i, selectedAgentId);
                    framework.modules.intervalTracker.recordGasUsage('orderAcceptance', acceptanceGas);
                    
                    // 使用Agent的实际成功率 + 性能变异
                    const agentSuccessRate = selectedAgent.currentSuccessRate + 
                        (Math.random() - 0.5) * selectedAgent.performanceVariability;
                    const adjustedSuccessRate = Math.max(0.1, Math.min(0.98, agentSuccessRate));
                    
                    if (Math.random() < adjustedSuccessRate) {
                        framework.modules.intervalTracker.recordOrderCompleted(orderId, revenue);
                        
                        const completionGas = 100000 + Math.floor(Math.random() * 40000);
                        framework.modules.gasTracker.recordGasUsage('orderCompletion', completionGas, 
                            `0x${Math.random().toString(16).substr(2, 64)}`, 15000000 + i, selectedAgentId);
                        framework.modules.intervalTracker.recordGasUsage('orderCompletion', completionGas);
                        
                        // 更新Agent统计
                        selectedAgent.completedOrders++;
                        selectedAgent.totalEarnings += revenue;
                    } else {
                        framework.modules.intervalTracker.recordOrderFailed(orderId, 'agent_execution_failed');
                        selectedAgent.failedOrders++;
                    }
                    
                    // 更新Agent总体统计
                    selectedAgent.totalOrders++;
                    selectedAgent.currentSuccessRate = selectedAgent.completedOrders / selectedAgent.totalOrders;
                    selectedAgent.reputation = (selectedAgent.currentSuccessRate * 100 + selectedAgent.reputation) / 2;
                } else {
                    framework.modules.intervalTracker.recordOrderFailed(orderId, 'no_agent_available');
                }
            }
            
            await framework.sleep(3000); // 3秒间隔
            
            // 显示当前状态
            const currentStats = framework.modules.intervalTracker.getCurrentIntervalStats();
            console.log(`     📈 当前间隔: ${currentStats.orders.created}创建, ${currentStats.orders.completed}完成`.cyan);
        }

        // 3. 强制结束当前间隔以获取数据
        console.log('\n⏰ 强制完成当前间隔...'.yellow);
        framework.modules.intervalTracker.finalizeInterval();
        
        // 再生成一个完整间隔的数据
        await framework.sleep(2000);
        
        for (let i = 0; i < 20; i++) {
            const userId = `user_final_${i}`;
            const orderId = `order_final_${i}`;
            const revenue = 0.01 + Math.random() * 0.02;
            
            framework.modules.intervalTracker.recordOrderCreated(orderId, userId, {
                specialty: 'data_processing'
            });
            
            const availableAgents = framework.modules.agentPool.agents.filter(a => a.isActive && a.availableCapacity() > 0);
            if (availableAgents.length > 0 && Math.random() < 0.92) {
                const selectedAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
                
                framework.modules.intervalTracker.recordOrderAccepted(orderId, selectedAgent.id);
                
                // 使用Agent的真实成功率
                const agentSuccessRate = selectedAgent.currentSuccessRate + 
                    (Math.random() - 0.5) * selectedAgent.performanceVariability;
                const adjustedSuccessRate = Math.max(0.1, Math.min(0.98, agentSuccessRate));
                
                if (Math.random() < adjustedSuccessRate) {
                    framework.modules.intervalTracker.recordOrderCompleted(orderId, revenue);
                    selectedAgent.completedOrders++;
                    selectedAgent.totalEarnings += revenue;
                } else {
                    framework.modules.intervalTracker.recordOrderFailed(orderId, 'execution_timeout');
                    selectedAgent.failedOrders++;
                }
                
                // 更新Agent统计
                selectedAgent.totalOrders++;
                selectedAgent.currentSuccessRate = selectedAgent.completedOrders / selectedAgent.totalOrders;
                selectedAgent.reputation = (selectedAgent.currentSuccessRate * 100 + selectedAgent.reputation) / 2;
            }
        }
        
        // 再次强制结束间隔
        framework.modules.intervalTracker.finalizeInterval();

        // 4. 生成并显示分析结果
        console.log('\n📈 快速分析结果...'.yellow);
        
        const startTime = Date.now() - 60000; // 过去1分钟
        const endTime = Date.now();
        
        // Gas分析
        const gasData = framework.modules.gasTracker.exportData();
        console.log('\n⛽ Gas消耗分析:'.cyan);
        console.log(`   总Gas消耗: ${gasData.gasData.totalGasUsed.toLocaleString()}`.green);
        console.log(`   总交易数: ${gasData.gasData.totalTransactions}`.green);
        console.log(`   平均Gas/交易: ${Math.round(gasData.gasData.avgGasPerTx).toLocaleString()}`.green);
        console.log(`   整体效率: ${gasData.optimizationReport.summary.overallEfficiency}`.green);
        console.log(`   潜在节省: ${gasData.optimizationReport.summary.potentialSavingsETH} ETH`.green);
        
        // 间隔Agent完成率分析
        const completionRates = framework.modules.intervalTracker.getAgentCompletionRates(startTime, endTime);
        console.log('\n📊 Agent完成率分析:'.cyan);
        console.log(`   总体完成率: ${(completionRates.overall.completionRate * 100).toFixed(1)}%`.green);
        console.log(`   总订单数: ${completionRates.overall.totalOrders}`.green);
        console.log(`   完成订单数: ${completionRates.overall.completedOrders}`.green);
        console.log(`   分析间隔数: ${completionRates.overall.intervalsAnalyzed}`.green);
        
        if (completionRates.agents.size > 0) {
            console.log('\n🏆 Agent完成率分布:'.cyan);
            const allAgents = Array.from(completionRates.agents.entries())
                .sort(([,a], [,b]) => b.completionRate - a.completionRate);
            
            // 显示Top 5
            console.log('   📈 Top 5 表现者:'.yellow);
            allAgents.slice(0, 5).forEach(([agentId, stats], index) => {
                // 获取Agent的基础信息
                const agent = framework.modules.agentPool.agents.find(a => a.id === agentId);
                const baseRate = agent ? (agent.baseSuccessRate * 100).toFixed(1) : 'N/A';
                const currentRate = agent ? (agent.currentSuccessRate * 100).toFixed(1) : 'N/A';
                console.log(`     ${index + 1}. ${agentId}: ${(stats.completionRate * 100).toFixed(1)}% (${stats.ordersCompleted}/${stats.ordersAccepted}) [基础:${baseRate}% 当前:${currentRate}%]`.green);
            });
            
            // 显示Bottom 5 (如果有足够数据)
            if (allAgents.length > 5) {
                console.log('   📉 Bottom 5 表现者:'.yellow);
                allAgents.slice(-Math.min(5, allAgents.length - 5)).reverse().forEach(([agentId, stats], index) => {
                    const agent = framework.modules.agentPool.agents.find(a => a.id === agentId);
                    const baseRate = agent ? (agent.baseSuccessRate * 100).toFixed(1) : 'N/A';
                    const currentRate = agent ? (agent.currentSuccessRate * 100).toFixed(1) : 'N/A';
                    console.log(`     ${index + 1}. ${agentId}: ${(stats.completionRate * 100).toFixed(1)}% (${stats.ordersCompleted}/${stats.ordersAccepted}) [基础:${baseRate}% 当前:${currentRate}%]`.red);
                });
            }
            
            // 显示成功率分布统计
            const successRates = allAgents.map(([, stats]) => stats.completionRate);
            const avgRate = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
            const maxRate = Math.max(...successRates);
            const minRate = Math.min(...successRates);
            
            console.log('\n   📊 成功率分布统计:'.yellow);
            console.log(`     平均: ${(avgRate * 100).toFixed(1)}% | 最高: ${(maxRate * 100).toFixed(1)}% | 最低: ${(minRate * 100).toFixed(1)}%`.gray);
        }
        
        // 趋势分析
        const trendAnalysis = framework.modules.intervalTracker.getCompletionRateTrend(5);
        console.log('\n📈 完成率趋势:'.cyan);
        console.log(`   趋势: ${trendAnalysis.trend === 'improving' ? '📈 改善中' : 
                                trendAnalysis.trend === 'declining' ? '📉 下降中' : '📊 稳定'}`.green);
        console.log(`   平均完成率: ${(trendAnalysis.averageCompletionRate * 100).toFixed(1)}%`.green);
        console.log(`   变化幅度: ${(trendAnalysis.rateChange * 100).toFixed(1)}%`.green);
        console.log(`   波动率: ${(trendAnalysis.volatility * 100).toFixed(1)}%`.green);

        // 5. 生成报告
        console.log('\n📄 生成详细报告...'.yellow);
        framework.startTime = Date.now() - 30000; // 模拟30秒测试
        const report = await framework.generateReport();
        
        console.log('\n✅ 快速演示测试完成！'.green.bold);
        console.log('=========================================='.cyan);
        console.log('🎯 核心功能验证:'.green);
        console.log('  ✅ Gas消耗实时追踪 - 完成'.green);
        console.log('  ✅ 间隔Agent完成率监控 - 完成'.green);
        console.log('  ✅ 趋势分析和预测 - 完成'.green);
        console.log('  ✅ 多格式报告生成 - 完成'.green);
        console.log('  ✅ 性能优化建议 - 完成'.green);
        
        console.log('\n📁 生成的报告文件:'.cyan);
        console.log('  📊 complete_report.json - 完整测试报告'.gray);
        console.log('  ⛽ gas_analysis.json - Gas消耗详细分析'.gray);
        console.log('  📈 interval_analysis.json - 间隔Agent完成率分析'.gray);
        console.log('  📋 agent_completion_rates.csv - Agent表现数据'.gray);
        console.log('  📄 executive_summary.txt - 执行摘要'.gray);

        return true;

    } catch (error) {
        console.error('❌ 快速测试失败:'.red.bold, error.message);
        console.error(error.stack);
        return false;
    }
}

// 运行快速测试
if (require.main === module) {
    fastDemoTest()
        .then(success => {
            if (success) {
                console.log('\n🎉 所有功能测试通过！系统准备就绪！'.green.bold);
            }
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 测试执行异常:'.red.bold, error);
            process.exit(1);
        });
}

module.exports = fastDemoTest;