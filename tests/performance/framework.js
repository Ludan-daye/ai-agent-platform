#!/usr/bin/env node

/**
 * 🚀 智能合约性能测试框架
 * Performance Testing Framework for Smart Contracts
 * 
 * 核心功能：
 * - 模块化测试组件
 * - 实时性能监控 
 * - 可视化参数调整
 * - 详细报告生成
 */

const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');
const colors = require('colors');
const moment = require('moment');

class PerformanceTestFramework extends EventEmitter {
    constructor() {
        super();
        this.config = null;
        this.testResults = [];
        this.isRunning = false;
        this.startTime = null;
        this.modules = {
            agentPool: null,
            userSimulator: null,
            smartSelector: null,
            monitor: null,
            gasTracker: null,
            intervalTracker: null
        };
        
        console.log('🚀 智能合约性能测试框架初始化'.green.bold);
        console.log('====================================='.cyan);
    }

    // 加载配置
    async loadConfig(configPath = './config/test-params.json') {
        try {
            const configFile = path.resolve(__dirname, configPath);
            this.config = await fs.readJson(configFile);
            console.log('✅ 配置加载成功'.green);
            return this.config;
        } catch (error) {
            console.error('❌ 配置加载失败:'.red, error.message);
            throw error;
        }
    }

    // 验证环境
    async validateEnvironment() {
        console.log('🔍 验证测试环境...'.yellow);
        
        const checks = [
            this.checkGanacheConnection(),
            this.checkConfigValidity(),
            this.checkOutputDirectories()
        ];

        try {
            await Promise.all(checks);
            console.log('✅ 环境验证通过'.green);
            return true;
        } catch (error) {
            console.error('❌ 环境验证失败:'.red, error.message);
            return false;
        }
    }

    // 检查Ganache连接
    async checkGanacheConnection() {
        // TODO: 实现Web3连接检查
        console.log('  📡 检查Ganache连接...'.gray);
        return true;
    }

    // 检查配置有效性
    checkConfigValidity() {
        console.log('  ⚙️  检查配置有效性...'.gray);
        if (!this.config) {
            throw new Error('配置未加载');
        }
        
        const required = ['networkConfig', 'testParameters'];
        for (const key of required) {
            if (!this.config[key]) {
                throw new Error(`缺少必需配置: ${key}`);
            }
        }
        return true;
    }

    // 检查输出目录
    async checkOutputDirectories() {
        console.log('  📁 检查输出目录...'.gray);
        const dirs = ['reports', 'logs', 'temp'];
        
        for (const dir of dirs) {
            const dirPath = path.resolve(__dirname, dir);
            await fs.ensureDir(dirPath);
        }
        return true;
    }

    // 初始化测试模块
    async initializeModules() {
        console.log('🔧 初始化测试模块...'.yellow);
        
        try {
            // 动态加载模块
            const AgentPool = require('./simulators/agent-pool');
            const UserSimulator = require('./simulators/user-behavior');
            const SmartSelector = require('./simulators/smart-selection');
            const Monitor = require('./monitors/performance');
            const GasTracker = require('./monitors/gas-tracker');
            const IntervalTracker = require('./monitors/interval-tracker');

            this.modules.agentPool = new AgentPool(this.config.testParameters.agents);
            this.modules.userSimulator = new UserSimulator(this.config.testParameters.users);
            this.modules.smartSelector = new SmartSelector(this.config.testParameters.users.selectionStrategy);
            this.modules.monitor = new Monitor(this.config.testParameters.monitoring);
            this.modules.gasTracker = new GasTracker({
                trackingInterval: this.config.testParameters.monitoring?.interval || 5000,
                gasPrice: this.config.networkConfig?.gasPrice || 20000000000,
                enableOptimization: true
            });
            this.modules.intervalTracker = new IntervalTracker({
                intervalDuration: this.config.testParameters.monitoring?.intervalDuration || 300000, // 5分钟
                trackingEnabled: true,
                maxHistoryIntervals: 100
            });

            console.log('✅ 模块初始化完成'.green);
            return true;
        } catch (error) {
            console.error('❌ 模块初始化失败:'.red, error.message);
            return false;
        }
    }

    // 运行测试
    async runTest(scenario = 'normal_load') {
        if (this.isRunning) {
            throw new Error('测试已在运行中');
        }

        this.isRunning = true;
        this.startTime = Date.now();
        
        console.log(`🎯 开始性能测试 - ${scenario}`.green.bold);
        console.log(`📊 参数: ${this.config.testParameters.agents.count}个Agent, ${this.config.testParameters.users.count}个用户`.cyan);
        console.log(`⏱️  持续时间: ${this.config.testParameters.simulation.duration}分钟`.cyan);
        
        try {
            // 启动监控
            await this.modules.monitor.start();
            
            // 发出测试开始事件
            this.emit('testStarted', { scenario, timestamp: this.startTime });
            
            // 运行测试场景
            await this.executeScenario(scenario);
            
            console.log('✅ 测试完成'.green.bold);
            return await this.generateReport();
            
        } catch (error) {
            console.error('❌ 测试执行失败:'.red, error.message);
            throw error;
        } finally {
            this.isRunning = false;
            await this.modules.monitor.stop();
        }
    }

    // 执行测试场景
    async executeScenario(scenario) {
        const duration = this.config.testParameters.simulation.duration * 60 * 1000; // 转换为毫秒
        const interval = this.config.testParameters.simulation.dataInterval * 1000;
        
        const endTime = Date.now() + duration;
        
        while (Date.now() < endTime) {
            // 模拟用户行为
            await this.simulateUserActivity();
            
            // 收集性能数据
            const metrics = await this.modules.monitor.collectMetrics();
            this.testResults.push({
                timestamp: Date.now(),
                metrics: metrics
            });
            
            // 等待下个间隔
            await this.sleep(interval);
        }
    }

    // 模拟用户活动
    async simulateUserActivity() {
        // 模拟订单创建和Agent选择
        const userStats = this.modules.userSimulator.getRealTimeStats();
        const agentStats = this.modules.agentPool.getRealTimeStats();
        
        // 模拟基本的用户活动
        const activeUserCount = Math.min(userStats.totalUsers / 100, 50); // 模拟活跃用户
        const availableAgentCount = agentStats.onlineAgents;
        const activeOrderCount = Math.min(activeUserCount, availableAgentCount, 20);
        
        for (let i = 0; i < activeOrderCount; i++) {
            // 创建模拟订单数据
            const userId = `user_${String(Math.floor(Math.random() * userStats.totalUsers)).padStart(5, '0')}`;
            const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const revenue = 0.001 + Math.random() * 0.02; // 0.001-0.021 ETH
            
            // 模拟订单要求
            const order = {
                specialty: ['ai_inference', 'data_processing', 'content_creation'][Math.floor(Math.random() * 3)],
                minReputation: 50 + Math.random() * 30,
                maxPrice: 0.005 + Math.random() * 0.02,
                urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                userType: ['casual', 'professional', 'enterprise'][Math.floor(Math.random() * 3)]
            };
            
            // 记录订单创建
            this.modules.intervalTracker.recordOrderCreated(orderId, userId, order);
            
            // 记录订单创建的Gas消耗
            const orderCreationGas = 80000 + Math.floor(Math.random() * 40000); // 80k-120k gas
            this.modules.gasTracker.recordGasUsage(
                'orderCreation',
                orderCreationGas,
                `0x${Math.random().toString(16).substr(2, 64)}`,
                Math.floor(Math.random() * 1000000) + 15000000,
                userId
            );
            this.modules.intervalTracker.recordGasUsage('orderCreation', orderCreationGas);
            
            // 智能Agent选择（如果有可用Agent）
            if (availableAgentCount > 0 && Math.random() < 0.9) { // 90%成功找到Agent
                // 获取一个真实的Agent对象，而不是随机ID
                const availableAgents = this.modules.agentPool.agents.filter(a => a.isActive && a.availableCapacity() > 0);
                if (availableAgents.length > 0) {
                    // 使用智能选择算法选择Agent
                    const selectedAgent = this.modules.smartSelector.selectAgent(availableAgents, order, { userId });
                    
                    if (selectedAgent) {
                        const selectedAgentId = selectedAgent.id;
                        
                        // 记录订单接受
                        this.modules.intervalTracker.recordOrderAccepted(orderId, selectedAgentId);
                        
                        // 记录订单接受的Gas消耗
                        const acceptanceGas = 60000 + Math.floor(Math.random() * 40000); // 60k-100k gas
                        this.modules.gasTracker.recordGasUsage(
                            'orderAcceptance',
                            acceptanceGas,
                            `0x${Math.random().toString(16).substr(2, 64)}`,
                            Math.floor(Math.random() * 1000000) + 15000000,
                            selectedAgentId
                        );
                        this.modules.intervalTracker.recordGasUsage('orderAcceptance', acceptanceGas);
                        
                        // 模拟订单完成或失败 - 使用Agent的实际成功率
                        const completionDelay = Math.random() * 30000 + 5000; // 5-35秒完成
                        setTimeout(() => {
                            // 使用选中Agent的实际成功率，并加入一些随机变异
                            const agentSuccessRate = selectedAgent.currentSuccessRate + 
                                (Math.random() - 0.5) * selectedAgent.performanceVariability;
                            
                            if (Math.random() < Math.max(0.1, Math.min(0.98, agentSuccessRate))) { // 限制在10%-98%范围内
                                // 记录订单完成
                                this.modules.intervalTracker.recordOrderCompleted(orderId, revenue);
                                
                                const completionGas = 100000 + Math.floor(Math.random() * 40000); // 100k-140k gas
                                this.modules.gasTracker.recordGasUsage(
                                    'orderCompletion',
                                    completionGas,
                                    `0x${Math.random().toString(16).substr(2, 64)}`,
                                    Math.floor(Math.random() * 1000000) + 15000000,
                                    selectedAgentId
                                );
                                this.modules.intervalTracker.recordGasUsage('orderCompletion', completionGas);
                                
                                // 更新Agent统计
                                selectedAgent.completedOrders++;
                                selectedAgent.totalEarnings += revenue;
                            } else {
                                // 记录订单失败
                                this.modules.intervalTracker.recordOrderFailed(orderId, 'agent_execution_failed');
                                selectedAgent.failedOrders++;
                            }
                            
                            // 更新Agent的总订单数和当前成功率
                            selectedAgent.totalOrders++;
                            if (selectedAgent.totalOrders > 0) {
                                selectedAgent.currentSuccessRate = selectedAgent.completedOrders / selectedAgent.totalOrders;
                                
                                // 更新信誉评分
                                const newReputation = (selectedAgent.currentSuccessRate * 100 + selectedAgent.reputation) / 2;
                                selectedAgent.reputation = Math.max(10, Math.min(100, newReputation));
                                selectedAgent.reputationHistory.push(selectedAgent.reputation);
                                selectedAgent.lastReputationUpdate = Date.now();
                            }
                        }, completionDelay);
                    } else {
                        // 智能选择失败，记录订单失败
                        setTimeout(() => {
                            this.modules.intervalTracker.recordOrderFailed(orderId, 'no_suitable_agent');
                        }, 1000);
                    }
                } else {
                    // 没有可用Agent
                    setTimeout(() => {
                        this.modules.intervalTracker.recordOrderFailed(orderId, 'all_agents_busy');
                    }, 1000);
                }
            } else {
                // 无可用Agent，记录失败
                setTimeout(() => {
                    this.modules.intervalTracker.recordOrderFailed(orderId, 'no_available_agent');
                }, 1000);
            }
        }
    }

    // 生成测试报告
    async generateReport() {
        const endTime = Date.now();
        const testDuration = endTime - this.startTime;
        
        // 收集所有模块的数据
        const gasData = this.modules.gasTracker ? this.modules.gasTracker.exportData() : null;
        const intervalData = this.modules.intervalTracker ? this.modules.intervalTracker.exportData() : null;
        const agentStats = this.modules.agentPool ? this.modules.agentPool.exportData() : null;
        const userStats = this.modules.userSimulator ? this.modules.userSimulator.exportData() : null;
        const selectionStats = this.modules.smartSelector ? this.modules.smartSelector.getAlgorithmStats() : null;
        
        // 获取间隔时间段Agent完成率分析
        const intervalAnalysis = intervalData ? this.modules.intervalTracker.getAgentCompletionRates(
            this.startTime,
            endTime
        ) : null;
        
        // 获取完成率趋势
        const trendAnalysis = intervalData ? this.modules.intervalTracker.getCompletionRateTrend() : null;
        
        const reportData = {
            testInfo: {
                scenario: 'performance_test',
                startTime: this.startTime,
                endTime: endTime,
                duration: testDuration,
                durationFormatted: moment.duration(testDuration).humanize(),
                config: this.config
            },
            
            // 系统整体概览
            systemOverview: {
                totalAgents: this.config.testParameters.agents.count,
                totalUsers: this.config.testParameters.users.count,
                testDuration: testDuration,
                ...this.calculateSummary()
            },
            
            // Agent性能分析
            agentAnalysis: agentStats,
            
            // 用户行为分析
            userBehaviorAnalysis: userStats,
            
            // 智能选择算法分析
            selectionAlgorithmAnalysis: selectionStats,
            
            // Gas消耗分析
            gasAnalysis: gasData ? {
                summary: gasData.gasData,
                efficiency: gasData.efficiency,
                optimizationReport: gasData.optimizationReport,
                gasPriceTrend: gasData.gasPriceTrend
            } : null,
            
            // 间隔时间段分析 (新功能)
            intervalAnalysis: intervalData ? {
                summary: intervalData.summary,
                currentInterval: intervalData.currentInterval,
                agentCompletionRates: intervalAnalysis,
                completionRateTrend: trendAnalysis,
                recentIntervals: Object.values(intervalData.intervals).slice(-10) // 最近10个间隔
            } : null,
            
            // 原始测试结果
            rawResults: this.testResults,
            
            // 报告生成信息
            reportMetadata: {
                generatedAt: endTime,
                version: '1.0.0',
                generatedBy: 'Smart Contract Performance Testing Framework'
            }
        };

        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const reportDir = path.resolve(__dirname, 'reports', `test_${timestamp}`);
        await fs.ensureDir(reportDir);

        // 保存完整JSON报告
        await fs.writeJson(path.join(reportDir, 'complete_report.json'), reportData, { spaces: 2 });
        
        // 保存Gas分析报告
        if (gasData) {
            await fs.writeJson(path.join(reportDir, 'gas_analysis.json'), gasData, { spaces: 2 });
        }
        
        // 保存间隔分析报告
        if (intervalData) {
            await fs.writeJson(path.join(reportDir, 'interval_analysis.json'), intervalData, { spaces: 2 });
        }
        
        // 生成CSV格式的Agent完成率数据
        if (intervalAnalysis && intervalAnalysis.agents.size > 0) {
            let csvContent = 'AgentID,OrdersAccepted,OrdersCompleted,CompletionRate,AvgCompletionTime,TotalRevenue,AvgRevenue\n';
            for (const [agentId, stats] of intervalAnalysis.agents.entries()) {
                csvContent += `${agentId},${stats.ordersAccepted},${stats.ordersCompleted},${(stats.completionRate * 100).toFixed(2)}%,${stats.avgCompletionTime.toFixed(2)}ms,${stats.totalRevenue.toFixed(6)} ETH,${stats.avgRevenue.toFixed(6)} ETH\n`;
            }
            await fs.writeFile(path.join(reportDir, 'agent_completion_rates.csv'), csvContent);
        }
        
        // 生成执行摘要
        const summary = this.generateExecutiveSummary(reportData);
        await fs.writeFile(path.join(reportDir, 'executive_summary.txt'), summary);
        
        console.log(`📄 完整报告已生成: ${reportDir}`.green);
        console.log(`   📊 complete_report.json - 完整测试报告`.gray);
        console.log(`   ⛽ gas_analysis.json - Gas消耗分析`.gray);
        console.log(`   📈 interval_analysis.json - 间隔时间段分析`.gray);
        console.log(`   📋 agent_completion_rates.csv - Agent完成率数据`.gray);
        console.log(`   📄 executive_summary.txt - 执行摘要`.gray);
        
        return reportData;
    }

    // 计算测试摘要
    calculateSummary() {
        if (this.testResults.length === 0) return {};

        const testDuration = Date.now() - this.startTime;
        return {
            totalRequests: this.testResults.length,
            duration: testDuration,
            avgResponseTime: 0,
            throughput: this.testResults.length / (testDuration / 1000) // requests per second
        };
    }

    // 生成执行摘要
    generateExecutiveSummary(reportData) {
        const summary = [];
        summary.push('🔸 智能合约性能测试 - 执行摘要');
        summary.push('=====================================');
        summary.push('');
        
        // 基本信息
        summary.push('📋 测试概览:');
        summary.push(`   测试时间: ${moment(reportData.testInfo.startTime).format('YYYY-MM-DD HH:mm:ss')}`);
        summary.push(`   测试持续: ${reportData.testInfo.durationFormatted}`);
        summary.push(`   Agent数量: ${reportData.systemOverview.totalAgents}`);
        summary.push(`   用户数量: ${reportData.systemOverview.totalUsers}`);
        summary.push('');
        
        // 间隔分析摘要
        if (reportData.intervalAnalysis) {
            const intervalSummary = reportData.intervalAnalysis.summary;
            const completionRateTrend = reportData.intervalAnalysis.completionRateTrend;
            
            summary.push('📊 间隔时间段Agent完成率分析:');
            summary.push(`   总监控间隔: ${intervalSummary.totalIntervals}个`);
            summary.push(`   平均完成率: ${(intervalSummary.avgCompletionRate * 100).toFixed(1)}%`);
            summary.push(`   总处理订单: ${intervalSummary.totalOrdersProcessed}个`);
            summary.push(`   完成率趋势: ${completionRateTrend.trend === 'improving' ? '📈 改善中' : 
                                    completionRateTrend.trend === 'declining' ? '📉 下降中' : '📊 稳定'}`);
            summary.push('');
        }
        
        // Gas消耗分析摘要
        if (reportData.gasAnalysis) {
            const gasData = reportData.gasAnalysis.summary;
            const gasOptimization = reportData.gasAnalysis.optimizationReport;
            
            summary.push('⛽ Gas消耗分析:');
            summary.push(`   总Gas消耗: ${gasData.totalGasUsed.toLocaleString()}`);
            summary.push(`   总交易数: ${gasData.totalTransactions}`);
            summary.push(`   平均Gas/交易: ${Math.round(gasData.avgGasPerTx).toLocaleString()}`);
            summary.push(`   整体效率: ${gasOptimization.summary.overallEfficiency}`);
            summary.push(`   潜在节省: ${gasOptimization.summary.potentialSavingsETH} ETH`);
            summary.push('');
        }
        
        // 顶级Agent表现
        if (reportData.intervalAnalysis && reportData.intervalAnalysis.agentCompletionRates.agents.size > 0) {
            const agents = Array.from(reportData.intervalAnalysis.agentCompletionRates.agents.entries())
                .sort(([, a], [, b]) => b.completionRate - a.completionRate)
                .slice(0, 5);
            
            summary.push('🏆 顶级Agent完成率 (Top 5):');
            agents.forEach(([agentId, stats], index) => {
                summary.push(`   ${index + 1}. ${agentId}: ${(stats.completionRate * 100).toFixed(1)}% (${stats.ordersCompleted}/${stats.ordersAccepted})`);
            });
            summary.push('');
        }
        
        // 关键发现和建议
        summary.push('💡 关键发现与建议:');
        
        if (reportData.gasAnalysis) {
            const gasOptimization = reportData.gasAnalysis.optimizationReport;
            if (gasOptimization.recommendations && gasOptimization.recommendations.length > 0) {
                gasOptimization.recommendations.forEach(rec => {
                    summary.push(`   • ${rec}`);
                });
            }
        }
        
        if (reportData.intervalAnalysis) {
            const overallRate = reportData.intervalAnalysis.agentCompletionRates.overall.completionRate;
            if (overallRate < 0.8) {
                summary.push(`   • 整体完成率偏低(${(overallRate * 100).toFixed(1)}%)，建议优化Agent筛选机制`);
            }
            if (overallRate > 0.95) {
                summary.push(`   • 整体完成率优秀(${(overallRate * 100).toFixed(1)}%)，系统运行良好`);
            }
        }
        
        summary.push('');
        summary.push('📈 更多详细分析请查看:');
        summary.push('   • complete_report.json - 完整测试数据');
        summary.push('   • interval_analysis.json - 间隔时间段分析');
        summary.push('   • gas_analysis.json - Gas消耗详细分析');
        summary.push('   • agent_completion_rates.csv - Agent完成率数据表');
        
        return summary.join('\n');
    }

    // 工具方法
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 停止测试
    stop() {
        this.isRunning = false;
        this.emit('testStopped');
        console.log('🛑 测试已停止'.yellow);
    }
}

module.exports = PerformanceTestFramework;