#!/usr/bin/env node

/**
 * 🧪 用户行为模拟器测试
 * User Behavior Simulator Test
 */

const UserBehaviorSimulator = require('./simulators/user-behavior');
const AgentPool = require('./simulators/agent-pool');
const colors = require('colors');

async function testUserBehavior() {
    console.log('🧪 用户行为模拟器测试开始'.cyan.bold);
    console.log('================================'.gray);

    try {
        // 1. 创建用户模拟器
        console.log('\n👥 测试1: 用户群体初始化'.yellow);
        const userSimulator = new UserBehaviorSimulator({
            count: 1000, // 测试用1000个用户
            orderFrequency: 3, // 3订单/分钟
            behaviorPatterns: ['burst', 'steady', 'random']
        });

        // 2. 验证用户群体分布
        console.log('\n📊 测试2: 用户群体分析'.yellow);
        const userStats = userSimulator.getUserStats();
        console.log(`   休闲用户: ${userStats.byType.casual}`.green);
        console.log(`   专业用户: ${userStats.byType.professional}`.green);
        console.log(`   企业用户: ${userStats.byType.enterprise}`.green);
        console.log(`   突发行为: ${userStats.byBehavior.burst}用户`.gray);
        console.log(`   稳定行为: ${userStats.byBehavior.steady}用户`.gray);
        console.log(`   随机行为: ${userStats.byBehavior.random}用户`.gray);

        // 3. 创建Agent池用于订单匹配
        console.log('\n🤖 测试3: 创建Agent池'.yellow);
        const agentPool = new AgentPool({
            count: 50,
            minDeposit: 0.1,
            maxDeposit: 2.0
        });

        // 4. 启动用户行为模拟
        console.log('\n🚀 测试4: 启动用户行为模拟'.yellow);
        
        let orderCreatedCount = 0;
        let orderProcessedCount = 0;
        
        // 监听用户事件
        userSimulator.on('userSessionStarted', ({ user }) => {
            console.log(`   🔗 用户 ${user.id} (${user.type}) 开始会话`.green);
        });
        
        userSimulator.on('orderCreated', ({ user, order }) => {
            orderCreatedCount++;
            console.log(`   📦 订单 ${order.id} 由用户 ${user.id} 创建 (${order.type}, ${order.urgency})`.cyan);
            
            // 尝试分配给Agent
            const selectedAgent = agentPool.selectAgent(order.requirements);
            if (selectedAgent) {
                agentPool.assignOrder(selectedAgent, order);
                console.log(`   ✅ 订单分配给Agent ${selectedAgent.id}`.green);
            } else {
                console.log(`   ⚠️  未找到合适的Agent`.yellow);
            }
        });
        
        // 监听订单完成
        agentPool.on('orderCompleted', ({ agent, order, success }) => {
            orderProcessedCount++;
            userSimulator.completeOrder(order.id, success, agent.id);
            const status = success ? '✅成功'.green : '❌失败'.red;
            console.log(`   ${status} 订单 ${order.id} 处理完成`.gray);
        });

        // 启动模拟
        userSimulator.startSimulation();

        // 5. 运行模拟并收集数据
        console.log('\n📈 测试5: 运行模拟 (10秒)'.yellow);
        const testDuration = 10000; // 10秒测试
        const startTime = Date.now();
        
        // 定期显示统计
        const statsInterval = setInterval(() => {
            const stats = userSimulator.getRealTimeStats();
            console.log(`   📊 活跃用户: ${stats.activeUsers}, 总订单: ${stats.totalOrders}, 队列: ${stats.pendingOrders}`.gray);
        }, 2000);

        // 等待测试完成
        await new Promise(resolve => setTimeout(resolve, testDuration));
        
        clearInterval(statsInterval);
        userSimulator.stopSimulation();

        // 6. 显示最终统计
        console.log('\n📈 测试6: 最终统计'.yellow);
        const finalStats = userSimulator.getRealTimeStats();
        const agentStats = agentPool.getRealTimeStats();
        
        console.log('   用户行为统计:'.cyan);
        console.log(`     总用户: ${finalStats.totalUsers}`.gray);
        console.log(`     最大活跃用户: ${finalStats.activeUsers}`.gray);
        console.log(`     总会话数: ${finalStats.totalSessions}`.gray);
        console.log(`     创建订单: ${finalStats.totalOrders}`.gray);
        console.log(`     完成订单: ${finalStats.completedOrders}`.gray);
        console.log(`     成功率: ${finalStats.completedOrders > 0 ? (finalStats.completedOrders / finalStats.totalOrders * 100).toFixed(1) : 0}%`.gray);
        
        console.log('   Agent处理统计:'.cyan);
        console.log(`     处理订单: ${agentStats.totalOrders}`.gray);
        console.log(`     完成订单: ${agentStats.completedOrders}`.gray);
        console.log(`     系统负载: ${(agentStats.systemLoad * 100).toFixed(1)}%`.gray);

        // 7. 用户偏好学习测试
        console.log('\n🎯 测试7: 用户偏好学习'.yellow);
        const activeUsers = userSimulator.users.filter(u => u.totalOrders > 0).slice(0, 5);
        for (const user of activeUsers) {
            console.log(`   👤 ${user.id} (${user.type}): ${user.totalOrders}订单, ${user.favoriteAgents.length}偏好Agent`.gray);
            if (user.agentRatings.size > 0) {
                const ratings = Array.from(user.agentRatings.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                console.log(`      评分最高: ${ratings.map(r => `${r[0]}(${r[1]})`).join(', ')}`.gray);
            }
        }

        // 8. 数据导出测试
        console.log('\n💾 测试8: 数据导出'.yellow);
        const exportData = userSimulator.exportData();
        const dataSize = JSON.stringify(exportData).length;
        console.log(`   导出数据大小: ${(dataSize / 1024).toFixed(1)}KB`.gray);
        console.log(`   包含用户数: ${exportData.users.length}`.gray);
        console.log(`   最近订单: ${exportData.recentOrders.length}`.gray);

        console.log('\n✅ 用户行为模拟器测试通过'.green.bold);
        return true;

    } catch (error) {
        console.error('❌ 测试失败:'.red.bold, error.message);
        console.error(error.stack);
        return false;
    }
}

// 运行测试
if (require.main === module) {
    testUserBehavior()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 测试执行失败:'.red.bold, error);
            process.exit(1);
        });
}

module.exports = testUserBehavior;