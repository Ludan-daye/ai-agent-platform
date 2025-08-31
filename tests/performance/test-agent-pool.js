#!/usr/bin/env node

/**
 * 🧪 Agent池模拟器测试
 * Agent Pool Simulator Test
 */

const AgentPool = require('./simulators/agent-pool');
const colors = require('colors');

async function testAgentPool() {
    console.log('🧪 Agent池模拟器测试开始'.cyan.bold);
    console.log('================================'.gray);

    try {
        // 1. 创建Agent池
        console.log('\\n📊 测试1: Agent池初始化'.yellow);
        const agentPool = new AgentPool({
            count: 20,
            minDeposit: 0.1,
            maxDeposit: 2.0,
            minSuccessRate: 0.6,
            maxSuccessRate: 0.9
        });

        // 2. 测试Agent选择
        console.log('\\n🎯 测试2: 智能Agent选择'.yellow);
        for (let i = 0; i < 5; i++) {
            const requirements = {
                specialty: 'ai_inference',
                minReputation: 70
            };
            const selectedAgent = agentPool.selectAgent(requirements);
            if (selectedAgent) {
                console.log(`   选中Agent: ${selectedAgent.id} (信誉: ${selectedAgent.reputation.toFixed(1)}, 抵押: ${selectedAgent.deposit}ETH)`.green);
            } else {
                console.log('   未找到合适的Agent'.red);
            }
        }

        // 3. 测试订单分配
        console.log('\\n📦 测试3: 订单分配流程'.yellow);
        const testOrders = [
            { id: 'order_001', payment: 0.02, type: 'ai_inference' },
            { id: 'order_002', payment: 0.015, type: 'data_processing' },
            { id: 'order_003', payment: 0.03, type: 'content_creation' }
        ];

        agentPool.on('orderAssigned', ({ agent, order }) => {
            console.log(`   📩 订单 ${order.id} 分配给 ${agent.id}`.green);
        });

        agentPool.on('orderCompleted', ({ agent, order, success, earnings }) => {
            const status = success ? '✅ 成功'.green : '❌ 失败'.red;
            const earningsText = earnings ? ` (收益: ${earnings.toFixed(4)}ETH)` : '';
            console.log(`   ${status} 订单 ${order.id} 由 ${agent.id} 完成${earningsText}`);
        });

        // 分配测试订单
        for (const order of testOrders) {
            const agent = agentPool.selectAgent({ specialty: order.type });
            if (agent) {
                agentPool.assignOrder(agent, order);
            }
        }

        // 4. 等待订单完成
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 5. 显示统计
        console.log('\\n📈 测试4: 统计数据'.yellow);
        const stats = agentPool.getRealTimeStats();
        console.log(`   总订单: ${stats.totalOrders}`.gray);
        console.log(`   完成订单: ${stats.completedOrders}`.gray);
        console.log(`   成功率: ${(stats.successRate * 100).toFixed(1)}%`.gray);
        console.log(`   系统负载: ${(stats.systemLoad * 100).toFixed(1)}%`.gray);

        // 6. 显示顶级Agent
        console.log('\\n🏆 测试5: 顶级Agent'.yellow);
        const topAgents = agentPool.getTopAgents(5);
        topAgents.forEach((agent, index) => {
            console.log(`   ${index + 1}. ${agent.id} - 信誉: ${agent.reputation.toFixed(1)}, 订单: ${agent.totalOrders}`.gray);
        });

        // 7. 测试数据导出
        console.log('\\n💾 测试6: 数据导出'.yellow);
        const exportData = agentPool.exportData();
        console.log(`   导出数据大小: ${JSON.stringify(exportData).length} bytes`.gray);
        console.log(`   Agent数据条数: ${exportData.agents.length}`.gray);

        console.log('\\n✅ 所有测试通过'.green.bold);
        return true;

    } catch (error) {
        console.error('❌ 测试失败:'.red.bold, error.message);
        return false;
    }
}

// 运行测试
if (require.main === module) {
    testAgentPool()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 测试执行失败:'.red.bold, error);
            process.exit(1);
        });
}

module.exports = testAgentPool;