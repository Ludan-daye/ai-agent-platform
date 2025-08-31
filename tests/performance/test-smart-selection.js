#!/usr/bin/env node

/**
 * 🧪 智能Agent选择算法测试
 * Smart Agent Selection Algorithm Test
 */

const SmartAgentSelector = require('./simulators/smart-selection');
const AgentPool = require('./simulators/agent-pool');
const colors = require('colors');

async function testSmartSelection() {
    console.log('🧪 智能Agent选择算法测试开始'.cyan.bold);
    console.log('=================================='.gray);

    try {
        // 1. 创建Agent池
        console.log('\n🤖 测试1: 创建Agent池'.yellow);
        const agentPool = new AgentPool({
            count: 30,
            minDeposit: 0.1,
            maxDeposit: 3.0,
            minSuccessRate: 0.6,
            maxSuccessRate: 0.95
        });

        // 2. 初始化智能选择算法
        console.log('\n🎯 测试2: 初始化智能选择算法'.yellow);
        const smartSelector = new SmartAgentSelector('adaptive');

        // 3. 测试基础选择功能
        console.log('\n📊 测试3: 基础Agent选择'.yellow);
        
        const testRequirements = [
            {
                specialty: 'ai_inference',
                minReputation: 70,
                maxPrice: 0.02,
                urgency: 'high',
                userType: 'enterprise',
                userId: 'user_001'
            },
            {
                specialty: 'data_processing', 
                minReputation: 60,
                maxPrice: 0.015,
                urgency: 'medium',
                userType: 'professional',
                userId: 'user_002'
            },
            {
                specialty: 'content_creation',
                minReputation: 50,
                maxPrice: 0.01,
                urgency: 'low',
                userType: 'casual',
                userId: 'user_003'
            }
        ];

        for (const [index, requirements] of testRequirements.entries()) {
            const availableAgents = agentPool.agents.filter(a => a.isActive);
            const selectedAgent = smartSelector.selectAgent(availableAgents, requirements, {
                userId: requirements.userId,
                sessionId: `session_${index}`
            });

            if (selectedAgent) {
                console.log(`   ✅ 选择Agent ${selectedAgent.id}:`.green);
                console.log(`      信誉: ${selectedAgent.reputation.toFixed(1)} | 抵押: ${selectedAgent.deposit}ETH | 专长: ${selectedAgent.specialties.join(', ')}`.gray);
            } else {
                console.log(`   ❌ 未找到符合要求的Agent`.red);
            }
        }

        // 4. 测试多轮选择和学习
        console.log('\n🔄 测试4: 多轮选择和学习'.yellow);
        
        let totalSelections = 0;
        let successfulSelections = 0;
        
        // 监听选择事件
        smartSelector.on('agentSelected', (record) => {
            totalSelections++;
            console.log(`   📈 选择记录: ${record.agentId} (${record.selectionReason})`.gray);
        });

        // 模拟50次选择
        for (let i = 0; i < 50; i++) {
            const userTypes = ['casual', 'professional', 'enterprise'];
            const urgencies = ['low', 'medium', 'high'];
            const specialties = ['ai_inference', 'data_processing', 'content_creation'];
            
            const requirements = {
                specialty: specialties[Math.floor(Math.random() * specialties.length)],
                minReputation: 50 + Math.random() * 30,
                maxPrice: 0.005 + Math.random() * 0.02,
                urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
                userType: userTypes[Math.floor(Math.random() * userTypes.length)],
                userId: `user_${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`
            };

            const availableAgents = agentPool.agents.filter(a => a.isActive);
            const selectedAgent = smartSelector.selectAgent(availableAgents, requirements, {
                userId: requirements.userId
            });

            if (selectedAgent) {
                successfulSelections++;
            }

            // 模拟一些选择结果反馈
            if (selectedAgent && Math.random() < 0.8) { // 80%成功率
                // 模拟成功完成订单，更新用户偏好
                const userId = requirements.userId;
                if (!smartSelector.userPreferences.has(userId)) {
                    smartSelector.userPreferences.set(userId, {
                        preferences: {},
                        agentRatings: new Map(),
                        selectionHistory: []
                    });
                }
                const userPrefs = smartSelector.userPreferences.get(userId);
                const currentRating = userPrefs.agentRatings.get(selectedAgent.id) || 70;
                userPrefs.agentRatings.set(selectedAgent.id, Math.min(100, currentRating + 2));
            }
        }

        console.log(`   📊 选择统计: ${successfulSelections}/${totalSelections} 成功选择 (${(successfulSelections/totalSelections*100).toFixed(1)}%)`.green);

        // 5. 测试算法统计和分析
        console.log('\n📈 测试5: 算法统计分析'.yellow);
        
        const stats = smartSelector.getAlgorithmStats();
        console.log('   算法性能统计:'.cyan);
        console.log(`     总选择次数: ${stats.totalSelections}`.gray);
        console.log(`     平均置信度: ${(stats.averageConfidence * 100).toFixed(1)}%`.gray);
        console.log(`     用户偏好数: ${stats.userPreferenceCount}`.gray);
        
        console.log('   选择策略分布:'.cyan);
        const strategyDist = stats.strategyDistribution;
        console.log(`     贪婪策略: ${strategyDist.greedy}次`.gray);
        console.log(`     均衡策略: ${strategyDist.balanced}次`.gray);
        console.log(`     探索策略: ${strategyDist.exploration}次`.gray);
        
        console.log('   市场动态:'.cyan);
        const market = stats.marketDynamics;
        console.log(`     平均价格: ${market.averagePrice.toFixed(4)} ETH`.gray);
        console.log(`     拥堵水平: ${(market.congestionLevel * 100).toFixed(1)}%`.gray);
        console.log(`     价格波动: ${(market.priceVolatility * 100).toFixed(1)}%`.gray);

        console.log('   当前权重:'.cyan);
        Object.entries(stats.currentWeights).forEach(([key, weight]) => {
            console.log(`     ${key}: ${(weight * 100).toFixed(1)}%`.gray);
        });

        // 6. 测试不同策略比较
        console.log('\n🔍 测试6: 策略效果比较'.yellow);
        
        const strategies = ['greedy', 'balanced', 'exploration', 'adaptive'];
        const strategyResults = {};
        
        for (const strategy of strategies) {
            const testSelector = new SmartAgentSelector(strategy);
            let successful = 0;
            
            for (let i = 0; i < 20; i++) {
                const requirements = {
                    specialty: 'ai_inference',
                    minReputation: 70,
                    maxPrice: 0.015,
                    urgency: 'medium',
                    userType: 'professional',
                    userId: `test_user_${i}`
                };
                
                const availableAgents = agentPool.agents.filter(a => a.isActive);
                const selected = testSelector.selectAgent(availableAgents, requirements);
                if (selected) successful++;
            }
            
            strategyResults[strategy] = {
                successRate: successful / 20,
                stats: testSelector.getAlgorithmStats()
            };
            
            console.log(`   📊 ${strategy}策略: ${(successful/20*100).toFixed(1)}%成功率`.cyan);
        }

        // 7. 测试负载均衡效果
        console.log('\n⚖️  测试7: 负载均衡效果'.yellow);
        
        // 模拟高负载情况
        agentPool.agents.forEach((agent, index) => {
            if (index < 15) { // 前15个Agent满负载
                agent.currentLoad = agent.maxConcurrentOrders;
            }
        });
        
        const loadBalanceResults = [];
        for (let i = 0; i < 10; i++) {
            const requirements = {
                specialty: 'ai_inference',
                minReputation: 60,
                maxPrice: 0.02,
                urgency: 'high',
                userType: 'enterprise',
                userId: `load_test_${i}`
            };
            
            const availableAgents = agentPool.agents.filter(a => a.isActive && a.availableCapacity() > 0);
            const selected = smartSelector.selectAgent(availableAgents, requirements);
            
            if (selected) {
                loadBalanceResults.push({
                    agentId: selected.id,
                    loadRatio: selected.currentLoad / selected.maxConcurrentOrders
                });
                console.log(`   ⚖️  选择Agent ${selected.id}, 负载: ${(selected.currentLoad/selected.maxConcurrentOrders*100).toFixed(1)}%`.green);
            }
        }
        
        const avgLoadRatio = loadBalanceResults.reduce((sum, r) => sum + r.loadRatio, 0) / loadBalanceResults.length;
        console.log(`   📊 平均选择负载: ${(avgLoadRatio * 100).toFixed(1)}%`.cyan);

        // 8. 测试数据导出
        console.log('\n💾 测试8: 数据导出'.yellow);
        
        const exportData = smartSelector.exportData();
        const dataSize = JSON.stringify(exportData).length;
        console.log(`   导出数据大小: ${(dataSize / 1024).toFixed(1)}KB`.gray);
        console.log(`   选择历史记录: ${exportData.selectionHistory.length}条`.gray);
        console.log(`   用户偏好记录: ${Object.keys(exportData.userPreferences).length}个用户`.gray);

        console.log('\n✅ 智能Agent选择算法测试通过'.green.bold);
        return true;

    } catch (error) {
        console.error('❌ 测试失败:'.red.bold, error.message);
        console.error(error.stack);
        return false;
    }
}

// 运行测试
if (require.main === module) {
    testSmartSelection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 测试执行失败:'.red.bold, error);
            process.exit(1);
        });
}

module.exports = testSmartSelection;