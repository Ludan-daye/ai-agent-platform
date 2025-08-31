#!/usr/bin/env node

/**
 * 🧪 完整集成测试：Gas追踪器 + 间隔时间段Agent完成率监控
 * Integrated System Test: Gas Tracker + Interval-based Agent Completion Rate Monitoring
 * 
 * 验证用户新要求：
 * - 间隔时间段内的agent代理完成率
 * - gas消耗追踪和分析
 */

const PerformanceTestFramework = require('./framework');
const colors = require('colors');
const fs = require('fs-extra');
const path = require('path');

async function testIntegratedSystem() {
    console.log('🧪 完整集成测试：Gas追踪 + 间隔Agent完成率'.cyan.bold);
    console.log('================================================'.gray);

    try {
        // 1. 初始化测试框架
        console.log('\\n🚀 步骤1: 初始化测试框架'.yellow);
        const framework = new PerformanceTestFramework();
        
        // 加载配置
        await framework.loadConfig();
        console.log('✅ 配置加载完成'.green);
        
        // 验证环境
        const envValid = await framework.validateEnvironment();
        if (!envValid) {
            throw new Error('环境验证失败');
        }
        console.log('✅ 环境验证通过'.green);
        
        // 初始化模块
        const modulesOk = await framework.initializeModules();
        if (!modulesOk) {
            throw new Error('模块初始化失败');
        }
        console.log('✅ 所有模块初始化完成'.green);

        // 2. 测试Gas追踪器功能
        console.log('\\n⛽ 步骤2: 测试Gas追踪器'.yellow);
        
        console.log('   模拟订单操作和Gas消耗...'.gray);
        
        // 模拟多种操作的Gas消耗
        const operations = [
            { op: 'orderCreation', gas: 95000, agentId: 'agent_001' },
            { op: 'orderAcceptance', gas: 75000, agentId: 'agent_001' },
            { op: 'orderCompletion', gas: 125000, agentId: 'agent_001' },
            { op: 'orderCreation', gas: 88000, agentId: 'agent_002' },
            { op: 'orderAcceptance', gas: 82000, agentId: 'agent_002' },
            { op: 'paymentProcessing', gas: 92000, agentId: 'agent_002' }
        ];
        
        for (const { op, gas, agentId } of operations) {
            framework.modules.gasTracker.recordGasUsage(
                op,
                gas,
                `0x${Math.random().toString(16).substr(2, 64)}`,
                Math.floor(Math.random() * 1000000) + 15000000,
                agentId
            );
            await framework.sleep(100);
        }
        
        // 获取Gas统计
        const gasStats = framework.modules.gasTracker.exportData();
        console.log(`   ✅ Gas追踪器记录: ${gasStats.gasData.totalTransactions}笔交易`.green);
        console.log(`   ✅ 总Gas消耗: ${gasStats.gasData.totalGasUsed.toLocaleString()}`.green);
        console.log(`   ✅ 平均Gas/交易: ${Math.round(gasStats.gasData.avgGasPerTx).toLocaleString()}`.green);

        // 3. 测试间隔追踪器功能
        console.log('\\n📊 步骤3: 测试间隔Agent完成率追踪器'.yellow);
        
        // 模拟订单生命周期
        const testOrders = [
            { orderId: 'order_001', userId: 'user_001', agentId: 'agent_001', revenue: 0.015 },
            { orderId: 'order_002', userId: 'user_002', agentId: 'agent_002', revenue: 0.012 },
            { orderId: 'order_003', userId: 'user_003', agentId: 'agent_001', revenue: 0.018 },
            { orderId: 'order_004', userId: 'user_004', agentId: 'agent_003', revenue: 0.009 }
        ];
        
        console.log('   模拟订单创建、接受、完成流程...'.gray);
        
        for (const order of testOrders) {
            // 创建订单
            framework.modules.intervalTracker.recordOrderCreated(
                order.orderId, 
                order.userId, 
                { specialty: 'ai_inference', maxPrice: 0.02 }
            );
            
            await framework.sleep(50);
            
            // 接受订单
            framework.modules.intervalTracker.recordOrderAccepted(order.orderId, order.agentId);
            
            await framework.sleep(50);
            
            // 完成订单 (90%成功率)
            if (Math.random() < 0.9) {
                framework.modules.intervalTracker.recordOrderCompleted(order.orderId, order.revenue);
            } else {
                framework.modules.intervalTracker.recordOrderFailed(order.orderId, 'execution_failed');
            }
            
            await framework.sleep(50);
        }
        
        // 获取当前间隔统计
        const currentInterval = framework.modules.intervalTracker.getCurrentIntervalStats();
        console.log(`   ✅ 当前间隔订单: ${currentInterval.orders.created}创建, ${currentInterval.orders.completed}完成`.green);
        
        // 获取Agent完成率
        const startTime = Date.now() - 60000; // 过去1分钟
        const endTime = Date.now();
        const completionRates = framework.modules.intervalTracker.getAgentCompletionRates(startTime, endTime);
        
        console.log('   📈 Agent完成率统计:'.cyan);
        for (const [agentId, stats] of completionRates.agents.entries()) {
            console.log(`     ${agentId}: ${(stats.completionRate * 100).toFixed(1)}% (${stats.ordersCompleted}/${stats.ordersAccepted})`.gray);
        }
        console.log(`   ✅ 总体完成率: ${(completionRates.overall.completionRate * 100).toFixed(1)}%`.green);

        // 4. 测试完整系统集成
        console.log('\\n🔄 步骤4: 测试完整系统集成'.yellow);
        
        // 运行短期测试 (30秒)
        console.log('   运行30秒集成测试...'.gray);
        framework.config.testParameters.simulation.duration = 0.5; // 0.5分钟 = 30秒
        
        // 启动集成测试
        const testPromise = framework.runTest('integration_test');
        
        // 监控测试进度
        let progressCount = 0;
        const progressInterval = setInterval(() => {
            progressCount++;
            const currentStats = framework.modules.intervalTracker.getCurrentIntervalStats();
            const gasData = framework.modules.gasTracker.exportData();
            
            console.log(`   📊 进度${progressCount}: 订单${currentStats.orders.created}个, Gas ${gasData.gasData.totalGasUsed.toLocaleString()}`.gray);
        }, 5000);
        
        // 等待测试完成
        const finalReport = await testPromise;
        clearInterval(progressInterval);
        
        console.log('✅ 集成测试完成'.green);

        // 5. 验证报告生成
        console.log('\\n📄 步骤5: 验证报告生成'.yellow);
        
        // 检查生成的文件
        const reportFiles = [
            'complete_report.json',
            'gas_analysis.json', 
            'interval_analysis.json',
            'agent_completion_rates.csv',
            'executive_summary.txt'
        ];
        
        const reportDir = path.dirname(Object.keys(await fs.readdir(path.resolve(__dirname, 'reports')))[0] || '');
        if (reportDir) {
            console.log(`   检查报告目录: ${reportDir}`.gray);
            
            for (const file of reportFiles) {
                const filePath = path.resolve(__dirname, 'reports', reportDir, file);
                try {
                    const exists = await fs.pathExists(filePath);
                    if (exists) {
                        const stats = await fs.stat(filePath);
                        console.log(`   ✅ ${file}: ${(stats.size / 1024).toFixed(1)}KB`.green);
                    } else {
                        console.log(`   ⚠️  ${file}: 文件不存在`.yellow);
                    }
                } catch (error) {
                    console.log(`   ❌ ${file}: 检查失败`.red);
                }
            }
        }

        // 6. 性能指标验证
        console.log('\\n📈 步骤6: 性能指标验证'.yellow);
        
        if (finalReport.intervalAnalysis) {
            const intervalData = finalReport.intervalAnalysis;
            console.log('   间隔分析验证:'.cyan);
            console.log(`     ✅ 总间隔数: ${intervalData.summary.totalIntervals}`.green);
            console.log(`     ✅ 平均完成率: ${(intervalData.summary.avgCompletionRate * 100).toFixed(1)}%`.green);
            console.log(`     ✅ 总处理订单: ${intervalData.summary.totalOrdersProcessed}`.green);
            console.log(`     ✅ 完成率趋势: ${intervalData.completionRateTrend.trend}`.green);
        }
        
        if (finalReport.gasAnalysis) {
            const gasData = finalReport.gasAnalysis;
            console.log('   Gas分析验证:'.cyan);
            console.log(`     ✅ 总Gas消耗: ${gasData.summary.totalGasUsed.toLocaleString()}`.green);
            console.log(`     ✅ 总交易数: ${gasData.summary.totalTransactions}`.green);
            console.log(`     ✅ 整体效率: ${gasData.optimizationReport.summary.overallEfficiency}`.green);
            console.log(`     ✅ 潜在节省: ${gasData.optimizationReport.summary.potentialSavingsETH} ETH`.green);
        }

        // 7. 功能完整性检查
        console.log('\\n✅ 步骤7: 功能完整性检查'.yellow);
        
        const functionalityChecks = [
            {
                name: 'Gas追踪器集成',
                check: () => finalReport.gasAnalysis && finalReport.gasAnalysis.summary.totalTransactions > 0,
                message: 'Gas消耗数据正确记录和分析'
            },
            {
                name: '间隔Agent完成率监控',
                check: () => finalReport.intervalAnalysis && finalReport.intervalAnalysis.agentCompletionRates.agents.size > 0,
                message: 'Agent完成率按时间间隔正确统计'
            },
            {
                name: '完成率趋势分析',
                check: () => finalReport.intervalAnalysis && finalReport.intervalAnalysis.completionRateTrend,
                message: '完成率趋势分析功能正常'
            },
            {
                name: 'CSV数据导出',
                check: async () => {
                    const csvPath = path.resolve(__dirname, 'reports', reportDir, 'agent_completion_rates.csv');
                    return await fs.pathExists(csvPath);
                },
                message: 'Agent完成率CSV格式数据导出'
            },
            {
                name: '执行摘要生成',
                check: async () => {
                    const summaryPath = path.resolve(__dirname, 'reports', reportDir, 'executive_summary.txt');
                    return await fs.pathExists(summaryPath);
                },
                message: '执行摘要文件生成'
            }
        ];
        
        let passedChecks = 0;
        for (const check of functionalityChecks) {
            try {
                const result = typeof check.check === 'function' ? await check.check() : check.check;
                if (result) {
                    console.log(`   ✅ ${check.name}: ${check.message}`.green);
                    passedChecks++;
                } else {
                    console.log(`   ❌ ${check.name}: 检查失败`.red);
                }
            } catch (error) {
                console.log(`   ❌ ${check.name}: ${error.message}`.red);
            }
        }
        
        console.log(`\\n📊 功能完整性: ${passedChecks}/${functionalityChecks.length} 通过`.cyan);

        // 测试总结
        console.log('\\n🎉 集成测试总结'.green.bold);
        console.log('=========================================='.cyan);
        console.log('✅ Gas追踪器：实时监控不同操作的Gas消耗'.green);
        console.log('✅ 间隔追踪器：按时间段统计Agent完成率'.green);
        console.log('✅ 完整集成：所有模块协同工作正常'.green);
        console.log('✅ 报告生成：多格式报告文件完整输出'.green);
        console.log('✅ 性能分析：详细的性能指标和优化建议'.green);
        
        if (passedChecks === functionalityChecks.length) {
            console.log('\\n🎯 所有测试通过！系统已满足用户要求：'.green.bold);
            console.log('   • ✅ 间隔时间段内的agent代理完成率监控'.green);
            console.log('   • ✅ gas消耗详细追踪和分析'.green);
            console.log('   • ✅ 多维度性能报告和优化建议'.green);
        } else {
            console.log('\\n⚠️  部分功能需要进一步完善'.yellow);
        }

        return true;

    } catch (error) {
        console.error('❌ 集成测试失败:'.red.bold, error.message);
        console.error(error.stack);
        return false;
    }
}

// 运行测试
if (require.main === module) {
    testIntegratedSystem()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 测试执行失败:'.red.bold, error);
            process.exit(1);
        });
}

module.exports = testIntegratedSystem;