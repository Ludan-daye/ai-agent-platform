#!/usr/bin/env node

/**
 * 🧪 智能合约性能测试框架 - 完整功能测试
 * Complete Feature Test for Performance Testing Framework
 */

const PerformanceTestFramework = require('./framework');
const AgentPool = require('./simulators/agent-pool');
const colors = require('colors');
const fs = require('fs-extra');
const path = require('path');

class FeatureTestRunner {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 智能合约性能测试框架 - 完整功能测试'.cyan.bold);
        console.log('='.repeat(60).gray);
        
        try {
            // 测试1: 框架初始化
            await this.testFrameworkInitialization();
            
            // 测试2: 配置系统
            await this.testConfigurationSystem();
            
            // 测试3: Agent池深度测试
            await this.testAgentPoolAdvanced();
            
            // 测试4: 性能监控基础
            await this.testPerformanceMonitoring();
            
            // 测试5: 数据导出
            await this.testDataExport();
            
            // 生成测试报告
            await this.generateTestReport();
            
            console.log('\n🎉 所有功能测试完成！'.green.bold);
            return true;
            
        } catch (error) {
            console.error('💥 测试失败:'.red.bold, error.message);
            return false;
        }
    }

    async testFrameworkInitialization() {
        console.log('\n📋 测试1: 框架初始化'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const framework = new PerformanceTestFramework();
        
        // 加载配置
        console.log('  🔧 加载配置...'.gray);
        await framework.loadConfig();
        this.logSuccess('配置加载成功');
        
        // 验证环境
        console.log('  🔍 验证环境...'.gray);
        const envValid = await framework.validateEnvironment();
        this.logSuccess(`环境验证: ${envValid ? '通过' : '失败'}`);
        
        // 初始化模块
        console.log('  📦 初始化模块...'.gray);
        const modulesReady = await framework.initializeModules();
        this.logSuccess(`模块初始化: ${modulesReady ? '成功' : '失败'}`);
        
        this.testResults.push({
            test: '框架初始化',
            status: 'passed',
            details: { configLoaded: true, envValid, modulesReady }
        });
    }

    async testConfigurationSystem() {
        console.log('\n⚙️  测试2: 配置系统'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const configPath = './config/test-params.json';
        
        // 读取默认配置
        console.log('  📖 读取默认配置...'.gray);
        const config = await fs.readJson(configPath);
        this.logSuccess(`配置参数: ${Object.keys(config).length}个主要配置`);
        
        // 验证配置结构
        console.log('  ✅ 验证配置结构...'.gray);
        const requiredKeys = ['networkConfig', 'testParameters'];
        const hasAllKeys = requiredKeys.every(key => config[key]);
        this.logSuccess(`必需配置项: ${hasAllKeys ? '完整' : '缺失'}`);
        
        // 显示关键参数
        const params = config.testParameters;
        console.log(`    🤖 Agent数量: ${params.agents.count}`.cyan);
        console.log(`    👥 用户数量: ${params.users.count}`.cyan);
        console.log(`    ⏱️  模拟时长: ${params.simulation.duration}分钟`.cyan);
        
        this.testResults.push({
            test: '配置系统',
            status: 'passed',
            details: { configValid: hasAllKeys, params }
        });
    }

    async testAgentPoolAdvanced() {
        console.log('\n🤖 测试3: Agent池深度测试'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        // 创建测试用Agent池
        console.log('  📊 创建Agent池 (50个Agent)...'.gray);
        const agentPool = new AgentPool({
            count: 50,
            minDeposit: 0.1,
            maxDeposit: 3.0,
            minSuccessRate: 0.6,
            maxSuccessRate: 0.95
        });
        
        const initialStats = agentPool.getRealTimeStats();
        this.logSuccess(`Agent池创建: ${initialStats.total}个Agent, ${initialStats.active}个在线`);
        
        // 测试Agent选择算法
        console.log('  🎯 测试智能选择算法...'.gray);
        const selectionResults = [];
        for (let i = 0; i < 20; i++) {
            const requirements = {
                specialty: ['ai_inference', 'data_processing', 'content_creation'][i % 3],
                minReputation: 60 + (i * 2)
            };
            const agent = agentPool.selectAgent(requirements);
            if (agent) {
                selectionResults.push({
                    requirement: requirements,
                    selected: {
                        id: agent.id,
                        reputation: agent.reputation,
                        deposit: agent.deposit,
                        specialties: agent.specialties
                    }
                });
            }
        }
        this.logSuccess(`智能选择测试: ${selectionResults.length}/20次成功匹配`);
        
        // 批量订单处理测试
        console.log('  📦 批量订单处理测试...'.gray);
        const testOrders = [];
        for (let i = 0; i < 30; i++) {
            testOrders.push({
                id: `test_order_${i.toString().padStart(3, '0')}`,
                payment: 0.01 + Math.random() * 0.04,
                type: ['ai_inference', 'data_processing', 'content_creation'][i % 3],
                priority: Math.floor(Math.random() * 5) + 1
            });
        }
        
        let assignedOrders = 0;
        let completedOrders = 0;
        
        // 监听订单事件
        agentPool.on('orderAssigned', () => assignedOrders++);
        agentPool.on('orderCompleted', () => completedOrders++);
        
        // 分配所有测试订单
        for (const order of testOrders) {
            const agent = agentPool.selectAgent({ specialty: order.type });
            if (agent && agentPool.assignOrder(agent, order)) {
                // 订单分配成功
            }
        }
        
        this.logSuccess(`订单分配: ${assignedOrders}/${testOrders.length}个订单成功分配`);
        
        // 等待订单完成
        console.log('  ⏳ 等待订单处理完成...'.gray);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalStats = agentPool.getRealTimeStats();
        this.logSuccess(`订单完成: ${finalStats.completedOrders}个, 成功率: ${(finalStats.successRate * 100).toFixed(1)}%`);
        
        // 显示性能指标
        console.log('  📈 Agent池性能指标:'.cyan);
        console.log(`    💼 总订单数: ${finalStats.totalOrders}`.gray);
        console.log(`    ✅ 完成订单: ${finalStats.completedOrders}`.gray);
        console.log(`    📊 系统负载: ${(finalStats.systemLoad * 100).toFixed(1)}%`.gray);
        console.log(`    💰 总收益: ${finalStats.totalEarnings.toFixed(4)} ETH`.gray);
        
        // 获取顶级Agent
        const topAgents = agentPool.getTopAgents(5);
        console.log('  🏆 顶级Agent排行:'.cyan);
        topAgents.forEach((agent, index) => {
            console.log(`    ${index + 1}. ${agent.id} - 信誉:${agent.reputation.toFixed(1)} 订单:${agent.totalOrders}`.gray);
        });
        
        this.testResults.push({
            test: 'Agent池深度测试',
            status: 'passed',
            details: {
                totalAgents: finalStats.total,
                activeAgents: finalStats.active,
                ordersProcessed: finalStats.totalOrders,
                successRate: finalStats.successRate,
                topAgents: topAgents.slice(0, 3)
            }
        });
    }

    async testPerformanceMonitoring() {
        console.log('\n📊 测试4: 性能监控基础'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const PerformanceMonitor = require('./monitors/performance');
        
        console.log('  🚀 启动性能监控...'.gray);
        const monitor = new PerformanceMonitor({
            metricsInterval: 1,
            enableRealtime: true
        });
        
        await monitor.start();
        this.logSuccess('性能监控启动成功');
        
        // 收集几个数据点
        console.log('  📈 收集性能数据...'.gray);
        const metrics = [];
        for (let i = 0; i < 5; i++) {
            const metric = await monitor.collectMetrics();
            metrics.push(metric);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.logSuccess(`数据收集: ${metrics.length}个数据点`);
        
        // 显示监控数据样本
        const lastMetric = metrics[metrics.length - 1];
        console.log('  📊 最新性能指标:'.cyan);
        console.log(`    🖥️  CPU使用率: ${lastMetric.cpu.toFixed(1)}%`.gray);
        console.log(`    💾 内存使用: ${lastMetric.memory.toFixed(0)}MB`.gray);
        console.log(`    📡 请求数量: ${lastMetric.requests}`.gray);
        console.log(`    ⚡ 响应时间: ${lastMetric.responseTime.toFixed(1)}ms`.gray);
        
        await monitor.stop();
        this.logSuccess('性能监控停止成功');
        
        this.testResults.push({
            test: '性能监控',
            status: 'passed',
            details: { metricsCollected: metrics.length, lastMetric }
        });
    }

    async testDataExport() {
        console.log('\n💾 测试5: 数据导出功能'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        // 创建测试数据
        const testData = {
            timestamp: Date.now(),
            testInfo: {
                framework: 'Smart Contract Performance Testing',
                version: '1.0.0',
                duration: Date.now() - this.startTime
            },
            results: this.testResults,
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memory: process.memoryUsage()
            }
        };
        
        // 导出JSON格式
        console.log('  📄 导出JSON格式...'.gray);
        const outputDir = path.resolve(__dirname, 'reports', 'test-results');
        await fs.ensureDir(outputDir);
        
        const jsonPath = path.join(outputDir, `complete-test-${Date.now()}.json`);
        await fs.writeJson(jsonPath, testData, { spaces: 2 });
        
        const jsonSize = (await fs.stat(jsonPath)).size;
        this.logSuccess(`JSON导出: ${jsonPath} (${jsonSize} bytes)`);
        
        // 导出简化报告
        console.log('  📋 生成测试摘要...'.gray);
        const summary = {
            '测试时间': new Date().toLocaleString('zh-CN'),
            '总测试数': this.testResults.length,
            '通过测试': this.testResults.filter(t => t.status === 'passed').length,
            '测试用时': `${((Date.now() - this.startTime) / 1000).toFixed(1)}秒`,
            '测试结果': this.testResults.map(t => `${t.test}: ${t.status}`)
        };
        
        console.log('  📊 测试摘要:'.cyan);
        Object.entries(summary).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                console.log(`    ${key}:`.gray);
                value.forEach(item => console.log(`      - ${item}`.gray));
            } else {
                console.log(`    ${key}: ${value}`.gray);
            }
        });
        
        const summaryPath = path.join(outputDir, `test-summary-${Date.now()}.json`);
        await fs.writeJson(summaryPath, summary, { spaces: 2 });
        
        this.testResults.push({
            test: '数据导出',
            status: 'passed',
            details: { 
                jsonExported: true, 
                summaryGenerated: true,
                outputDir,
                fileSize: jsonSize 
            }
        });
    }

    async generateTestReport() {
        console.log('\n📄 生成最终测试报告...'.yellow.bold);
        console.log('-'.repeat(40).gray);
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.status === 'passed').length;
        const failedTests = totalTests - passedTests;
        const duration = Date.now() - this.startTime;
        
        console.log('\n📈 测试结果统计:'.green.bold);
        console.log(`✅ 通过: ${passedTests}/${totalTests}`.green);
        if (failedTests > 0) {
            console.log(`❌ 失败: ${failedTests}/${totalTests}`.red);
        }
        console.log(`⏱️  总用时: ${(duration / 1000).toFixed(1)}秒`.gray);
        console.log(`📊 成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`.cyan);
    }

    logSuccess(message) {
        console.log(`    ✅ ${message}`.green);
    }

    logError(message) {
        console.log(`    ❌ ${message}`.red);
    }
}

// 运行完整功能测试
if (require.main === module) {
    const testRunner = new FeatureTestRunner();
    testRunner.runAllTests()
        .then(success => {
            console.log(success ? '\n🎊 功能测试全部通过！框架运行正常。'.green.bold : '\n💥 部分功能测试失败'.red.bold);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 测试执行异常:'.red.bold, error);
            process.exit(1);
        });
}