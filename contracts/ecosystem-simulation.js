#!/usr/bin/env node

/**
 * 🌍 AI Agent Platform 生态系统模拟测试
 * Ecosystem Simulation with Multiple Agents & Users
 * 
 * 功能:
 * - 多Agent池 (不同抵押金、完成率)
 * - 多用户持续下单
 * - 时间序列数据记录
 * - 实时指标统计
 * - 数据可视化输出
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EcosystemSimulator {
    constructor(config = {}) {
        this.config = {
            // Agent配置
            agentCount: config.agentCount || 20,
            minDeposit: config.minDeposit || 0.1, // ETH
            maxDeposit: config.maxDeposit || 2.0, // ETH
            
            // User配置  
            userCount: config.userCount || 50,
            orderFrequency: config.orderFrequency || 2, // orders per minute per user
            
            // 模拟配置
            simulationDuration: config.simulationDuration || 60, // minutes
            timeInterval: config.timeInterval || 5, // data collection interval (minutes)
            
            // 任务配置
            taskTypes: config.taskTypes || ['compute', 'data_processing', 'ml_inference', 'content_creation'],
            difficultyLevels: config.difficultyLevels || ['easy', 'medium', 'hard', 'expert']
        };
        
        // 状态跟踪
        this.agents = [];
        this.users = [];
        this.orders = [];
        this.timeSeriesData = [];
        this.currentTime = 0;
        
        console.log('🌍 AI Agent Platform 生态系统模拟器');
        console.log('=====================================');
        console.log(`📊 配置: ${this.config.agentCount}个Agent, ${this.config.userCount}个用户`);
        console.log(`⏱️ 模拟时长: ${this.config.simulationDuration}分钟`);
        console.log(`📈 数据采集间隔: ${this.config.timeInterval}分钟`);
    }

    // 初始化Agent池
    initializeAgents() {
        console.log('\n🤖 初始化Agent池...');
        
        for (let i = 0; i < this.config.agentCount; i++) {
            // 生成随机Agent特性
            const baseSuccessRate = 0.6 + Math.random() * 0.35; // 60-95%
            const deposit = this.config.minDeposit + Math.random() * (this.config.maxDeposit - this.config.minDeposit);
            const specialties = this.generateAgentSpecialties();
            
            const agent = {
                id: `agent_${i.toString().padStart(3, '0')}`,
                address: this.generateAddress(),
                deposit: parseFloat(deposit.toFixed(4)),
                baseSuccessRate: parseFloat(baseSuccessRate.toFixed(3)),
                specialties: specialties,
                
                // 动态统计
                totalOrders: 0,
                completedOrders: 0,
                currentSuccessRate: baseSuccessRate,
                averageCompletionTime: 8000 + Math.random() * 6000, // 8-14s base
                reputation: baseSuccessRate * 100,
                
                // 状态
                isActive: true,
                currentCapacity: Math.floor(Math.random() * 5 + 3), // 3-7 concurrent orders
                currentLoad: 0,
                lastUpdateTime: 0
            };
            
            this.agents.push(agent);
        }
        
        // 按抵押金排序显示
        const sortedAgents = [...this.agents].sort((a, b) => b.deposit - a.deposit);
        console.log(`✅ Agent池初始化完成:`);
        console.log(`   最高抵押: ${sortedAgents[0].deposit} ETH (${sortedAgents[0].id}, ${(sortedAgents[0].baseSuccessRate*100).toFixed(1)}% 预期成功率)`);
        console.log(`   最低抵押: ${sortedAgents[sortedAgents.length-1].deposit} ETH (${sortedAgents[sortedAgents.length-1].id}, ${(sortedAgents[sortedAgents.length-1].baseSuccessRate*100).toFixed(1)}% 预期成功率)`);
        console.log(`   平均抵押: ${(this.agents.reduce((sum, a) => sum + a.deposit, 0) / this.agents.length).toFixed(3)} ETH`);
    }

    // 初始化用户
    initializeUsers() {
        console.log('\n👥 初始化用户池...');
        
        for (let i = 0; i < this.config.userCount; i++) {
            const user = {
                id: `user_${i.toString().padStart(3, '0')}`,
                address: this.generateAddress(),
                totalBudget: 5 + Math.random() * 20, // 5-25 ETH
                
                // 用户偏好
                preferredTaskTypes: this.sampleArray(this.config.taskTypes, Math.floor(Math.random() * 3 + 1)),
                riskTolerance: Math.random(), // 0-1, affects agent selection
                priceToleranceMultiplier: 0.8 + Math.random() * 0.4, // 0.8-1.2x
                
                // 统计
                totalOrders: 0,
                successfulOrders: 0,
                totalSpent: 0,
                averageCost: 0,
                
                // 状态
                isActive: true,
                lastOrderTime: 0,
                orderInterval: (60 / this.config.orderFrequency) + Math.random() * 30 // seconds
            };
            
            this.users.push(user);
        }
        
        console.log(`✅ 用户池初始化完成:`);
        console.log(`   总预算: ${this.users.reduce((sum, u) => sum + u.totalBudget, 0).toFixed(2)} ETH`);
        console.log(`   平均预算: ${(this.users.reduce((sum, u) => sum + u.totalBudget, 0) / this.users.length).toFixed(3)} ETH`);
    }

    // 生成Agent专长领域
    generateAgentSpecialties() {
        const numSpecialties = Math.floor(Math.random() * 3) + 1; // 1-3 specialties
        const specialties = {};
        
        const selectedTypes = this.sampleArray(this.config.taskTypes, numSpecialties);
        selectedTypes.forEach(type => {
            specialties[type] = {
                proficiency: 0.7 + Math.random() * 0.3, // 70-100% proficiency
                priceMultiplier: 0.8 + Math.random() * 0.4 // 0.8-1.2x pricing
            };
        });
        
        return specialties;
    }

    // 智能合约订单匹配算法
    matchOrder(order) {
        // 筛选可用Agent
        const availableAgents = this.agents.filter(agent => 
            agent.isActive && 
            agent.currentLoad < agent.currentCapacity &&
            agent.specialties[order.taskType] // 有相关专长
        );
        
        if (availableAgents.length === 0) {
            return null; // 无可用Agent
        }
        
        // 综合评分算法 (模拟智能合约逻辑)
        const scoredAgents = availableAgents.map(agent => {
            const specialty = agent.specialties[order.taskType];
            const proficiencyScore = specialty.proficiency * 100;
            const reputationScore = agent.reputation;
            const capacityScore = (agent.currentCapacity - agent.currentLoad) / agent.currentCapacity * 50;
            const depositScore = Math.min(agent.deposit / 1.0, 1) * 30; // 标准化到1 ETH
            
            const totalScore = proficiencyScore + reputationScore + capacityScore + depositScore;
            
            return {
                agent,
                score: totalScore,
                estimatedPrice: this.calculateOrderPrice(order, agent)
            };
        });
        
        // 根据用户风险偏好选择
        scoredAgents.sort((a, b) => b.score - a.score);
        
        const user = this.users.find(u => u.id === order.userId);
        let selectedIndex = 0;
        
        if (user.riskTolerance > 0.7) {
            // 高风险偏好，选择评分最高的
            selectedIndex = 0;
        } else if (user.riskTolerance > 0.3) {
            // 中等风险，在前50%中随机选择
            selectedIndex = Math.floor(Math.random() * Math.min(3, scoredAgents.length));
        } else {
            // 低风险偏好，在前30%中选择抵押金最高的
            const topAgents = scoredAgents.slice(0, Math.max(1, Math.floor(scoredAgents.length * 0.3)));
            topAgents.sort((a, b) => b.agent.deposit - a.agent.deposit);
            selectedIndex = scoredAgents.indexOf(topAgents[0]);
        }
        
        return scoredAgents[selectedIndex];
    }

    // 计算订单价格
    calculateOrderPrice(order, agent) {
        const basePrices = {
            easy: 0.005,
            medium: 0.012,
            hard: 0.025,
            expert: 0.045
        };
        
        const basePrice = basePrices[order.difficulty];
        const specialty = agent.specialties[order.taskType];
        const priceMultiplier = specialty.priceMultiplier;
        const marketAdjustment = 0.9 + Math.random() * 0.2; // 市场波动 ±10%
        
        return basePrice * priceMultiplier * marketAdjustment;
    }

    // 模拟订单执行
    async executeOrder(order, matchResult) {
        const { agent, estimatedPrice } = matchResult;
        
        // 更新Agent负载
        agent.currentLoad++;
        
        // 模拟执行时间 (根据Agent能力和任务难度)
        const difficultyMultipliers = { easy: 0.8, medium: 1.0, hard: 1.3, expert: 1.8 };
        const specialty = agent.specialties[order.taskType];
        const executionTime = agent.averageCompletionTime * 
                            difficultyMultipliers[order.difficulty] * 
                            (2 - specialty.proficiency); // 专长越高执行越快
        
        // 模拟成功概率 (基础成功率 × 专长加成 × 难度惩罚)
        const difficultyPenalties = { easy: 1.0, medium: 0.95, hard: 0.85, expert: 0.7 };
        const successProbability = agent.baseSuccessRate * 
                                 specialty.proficiency * 
                                 difficultyPenalties[order.difficulty];
        
        const isSuccess = Math.random() < successProbability;
        const actualExecutionTime = executionTime * (0.8 + Math.random() * 0.4); // ±20% 变化
        
        // 更新订单状态
        order.agentId = agent.id;
        order.status = isSuccess ? 'completed' : 'failed';
        order.actualPrice = estimatedPrice;
        order.executionTime = Math.round(actualExecutionTime);
        order.completedAt = this.currentTime + actualExecutionTime / 60000; // 转换为分钟
        
        // 更新Agent统计
        agent.totalOrders++;
        if (isSuccess) {
            agent.completedOrders++;
        }
        agent.currentSuccessRate = agent.completedOrders / agent.totalOrders;
        agent.reputation = this.calculateReputation(agent);
        agent.currentLoad--; // 订单完成，释放容量
        
        // 更新用户统计
        const user = this.users.find(u => u.id === order.userId);
        user.totalOrders++;
        if (isSuccess) {
            user.successfulOrders++;
            user.totalSpent += order.actualPrice;
        }
        user.averageCost = user.totalSpent / user.successfulOrders || 0;
        
        return order;
    }

    // 计算Agent信誉分数
    calculateReputation(agent) {
        if (agent.totalOrders === 0) return agent.baseSuccessRate * 100;
        
        const successRateScore = agent.currentSuccessRate * 70;
        const volumeBonus = Math.min(agent.totalOrders / 10, 1) * 20; // 订单量加成
        const depositScore = Math.min(agent.deposit / 1.0, 1) * 10; // 抵押金加成
        
        return successRateScore + volumeBonus + depositScore;
    }

    // 生成新订单
    generateOrder() {
        // 随机选择活跃用户
        const activeUsers = this.users.filter(u => u.isActive && u.totalBudget > u.totalSpent + 0.01);
        if (activeUsers.length === 0) return null;
        
        const user = activeUsers[Math.floor(Math.random() * activeUsers.length)];
        
        // 检查用户订单间隔
        if (this.currentTime - user.lastOrderTime < user.orderInterval / 60) {
            return null;
        }
        
        const order = {
            id: `order_${this.orders.length.toString().padStart(6, '0')}`,
            userId: user.id,
            taskType: user.preferredTaskTypes[Math.floor(Math.random() * user.preferredTaskTypes.length)],
            difficulty: this.config.difficultyLevels[Math.floor(Math.random() * this.config.difficultyLevels.length)],
            createdAt: this.currentTime,
            status: 'pending',
            
            // 订单要求
            maxPrice: user.priceToleranceMultiplier * 0.02, // 基准价格容忍度
            deadline: this.currentTime + 10 + Math.random() * 20, // 10-30分钟期限
            
            // 执行结果 (待填充)
            agentId: null,
            actualPrice: 0,
            executionTime: 0,
            completedAt: null
        };
        
        user.lastOrderTime = this.currentTime;
        return order;
    }

    // 收集时间序列数据
    collectTimeSeriesData() {
        const completedOrders = this.orders.filter(o => o.status === 'completed');
        const failedOrders = this.orders.filter(o => o.status === 'failed');
        
        // 整体指标
        const totalOrders = this.orders.length;
        const successRate = totalOrders > 0 ? completedOrders.length / totalOrders : 0;
        const averagePrice = completedOrders.length > 0 ? 
                           completedOrders.reduce((sum, o) => sum + o.actualPrice, 0) / completedOrders.length : 0;
        const averageExecutionTime = completedOrders.length > 0 ?
                                   completedOrders.reduce((sum, o) => sum + o.executionTime, 0) / completedOrders.length : 0;
        
        // Agent指标
        const activeAgents = this.agents.filter(a => a.totalOrders > 0);
        const agentMetrics = activeAgents.map(a => ({
            id: a.id,
            totalOrders: a.totalOrders,
            successRate: a.currentSuccessRate,
            reputation: a.reputation,
            deposit: a.deposit,
            currentLoad: a.currentLoad,
            capacity: a.currentCapacity
        }));
        
        // 用户指标
        const activeUsers = this.users.filter(u => u.totalOrders > 0);
        const userMetrics = {
            totalActiveUsers: activeUsers.length,
            averageOrdersPerUser: activeUsers.reduce((sum, u) => sum + u.totalOrders, 0) / activeUsers.length || 0,
            averageSuccessRateByUser: activeUsers.reduce((sum, u) => sum + (u.successfulOrders / u.totalOrders || 0), 0) / activeUsers.length || 0,
            totalVolume: activeUsers.reduce((sum, u) => sum + u.totalSpent, 0)
        };
        
        // 任务类型分布
        const taskTypeDistribution = {};
        this.config.taskTypes.forEach(type => {
            const typeOrders = this.orders.filter(o => o.taskType === type);
            taskTypeDistribution[type] = {
                count: typeOrders.length,
                successRate: typeOrders.length > 0 ? 
                           typeOrders.filter(o => o.status === 'completed').length / typeOrders.length : 0
            };
        });
        
        const dataPoint = {
            timestamp: this.currentTime,
            overall: {
                totalOrders,
                successRate,
                averagePrice,
                averageExecutionTime,
                activeAgents: activeAgents.length,
                totalDeposits: this.agents.reduce((sum, a) => sum + a.deposit, 0)
            },
            agents: agentMetrics,
            users: userMetrics,
            taskTypes: taskTypeDistribution
        };
        
        this.timeSeriesData.push(dataPoint);
        
        console.log(`📊 [${this.currentTime.toFixed(1)}min] Orders: ${totalOrders}, Success: ${(successRate*100).toFixed(1)}%, Avg Price: ${averagePrice.toFixed(4)} ETH`);
    }

    // 运行模拟
    async runSimulation() {
        console.log('\n🚀 开始生态系统模拟...');
        
        // 初始化
        this.initializeAgents();
        this.initializeUsers();
        
        console.log('\n⏰ 模拟进行中...');
        const startTime = Date.now();
        
        // 主模拟循环
        for (let minute = 0; minute <= this.config.simulationDuration; minute++) {
            this.currentTime = minute;
            
            // 每分钟生成多个订单
            const ordersThisMinute = Math.floor(Math.random() * 10 + 5); // 5-15个订单/分钟
            
            for (let i = 0; i < ordersThisMinute; i++) {
                const order = this.generateOrder();
                if (order) {
                    const matchResult = this.matchOrder(order);
                    if (matchResult) {
                        await this.executeOrder(order, matchResult);
                        this.orders.push(order);
                    }
                }
            }
            
            // 定期收集数据
            if (minute % this.config.timeInterval === 0) {
                this.collectTimeSeriesData();
            }
            
            // 模拟时间推进 (实际测试中可以调整速度)
            if (minute % 10 === 0) {
                const progress = Math.round((minute / this.config.simulationDuration) * 100);
                process.stdout.write(`\r🕐 模拟进度: ${progress}% (${minute}/${this.config.simulationDuration}分钟)`);
            }
        }
        
        const endTime = Date.now();
        console.log(`\n✅ 模拟完成! 耗时: ${((endTime - startTime) / 1000).toFixed(2)}s`);
        
        return this.generateReport();
    }

    // 生成综合报告
    generateReport() {
        const totalOrders = this.orders.length;
        const completedOrders = this.orders.filter(o => o.status === 'completed');
        const failedOrders = this.orders.filter(o => o.status === 'failed');
        
        const report = {
            metadata: {
                simulationDuration: this.config.simulationDuration,
                agentCount: this.config.agentCount,
                userCount: this.config.userCount,
                generatedAt: new Date().toISOString()
            },
            
            summary: {
                totalOrders,
                completedOrders: completedOrders.length,
                failedOrders: failedOrders.length,
                overallSuccessRate: totalOrders > 0 ? completedOrders.length / totalOrders : 0,
                totalVolume: completedOrders.reduce((sum, o) => sum + o.actualPrice, 0),
                averageOrderValue: completedOrders.length > 0 ? 
                                 completedOrders.reduce((sum, o) => sum + o.actualPrice, 0) / completedOrders.length : 0
            },
            
            agentAnalysis: this.analyzeAgents(),
            userAnalysis: this.analyzeUsers(),
            timeSeriesData: this.timeSeriesData,
            
            // 性能指标
            performance: {
                averageExecutionTime: completedOrders.length > 0 ?
                                    completedOrders.reduce((sum, o) => sum + o.executionTime, 0) / completedOrders.length : 0,
                p95ExecutionTime: this.calculatePercentile(completedOrders.map(o => o.executionTime), 95),
                systemThroughput: totalOrders / this.config.simulationDuration, // orders per minute
                agentUtilization: this.agents.reduce((sum, a) => sum + (a.totalOrders / this.config.simulationDuration), 0) / this.agents.length
            }
        };
        
        return report;
    }

    // 分析Agent表现
    analyzeAgents() {
        const agentStats = this.agents.map(agent => ({
            id: agent.id,
            deposit: agent.deposit,
            totalOrders: agent.totalOrders,
            successRate: agent.currentSuccessRate,
            reputation: agent.reputation,
            specialties: Object.keys(agent.specialties),
            profitability: agent.totalOrders * 0.01, // 简化收入计算
            efficiency: agent.totalOrders / this.config.simulationDuration // 订单/分钟
        }));
        
        // 排序和分析
        const byOrders = [...agentStats].sort((a, b) => b.totalOrders - a.totalOrders);
        const bySuccessRate = [...agentStats].sort((a, b) => b.successRate - a.successRate);
        const byDeposit = [...agentStats].sort((a, b) => b.deposit - a.deposit);
        
        return {
            all: agentStats,
            topByVolume: byOrders.slice(0, 5),
            topBySuccessRate: bySuccessRate.slice(0, 5),
            topByDeposit: byDeposit.slice(0, 5),
            summary: {
                averageOrders: agentStats.reduce((sum, a) => sum + a.totalOrders, 0) / agentStats.length,
                averageSuccessRate: agentStats.reduce((sum, a) => sum + a.successRate, 0) / agentStats.length,
                totalDeposits: agentStats.reduce((sum, a) => sum + a.deposit, 0)
            }
        };
    }

    // 分析用户行为
    analyzeUsers() {
        const activeUsers = this.users.filter(u => u.totalOrders > 0);
        
        return {
            totalUsers: this.users.length,
            activeUsers: activeUsers.length,
            activationRate: activeUsers.length / this.users.length,
            averageOrdersPerUser: activeUsers.reduce((sum, u) => sum + u.totalOrders, 0) / activeUsers.length || 0,
            averageSuccessRate: activeUsers.reduce((sum, u) => sum + (u.successfulOrders / u.totalOrders || 0), 0) / activeUsers.length || 0,
            totalSpent: activeUsers.reduce((sum, u) => sum + u.totalSpent, 0),
            averageSpendingPerUser: activeUsers.reduce((sum, u) => sum + u.totalSpent, 0) / activeUsers.length || 0
        };
    }

    // 保存结果和生成图表数据
    async saveResults() {
        const resultsDir = path.join(__dirname, 'simulation_results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const report = this.generateReport();
        
        // 保存完整报告
        const reportPath = path.join(resultsDir, `ecosystem_report_${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 生成CSV文件用于图表制作
        await this.generateCSVFiles(resultsDir, timestamp);
        
        // 生成可视化HTML
        await this.generateVisualization(resultsDir, timestamp, report);
        
        console.log(`\n📄 结果已保存:`);
        console.log(`   📊 完整报告: ${reportPath}`);
        console.log(`   📈 图表数据: ${resultsDir}/`);
        console.log(`   🌐 可视化页面: ${resultsDir}/ecosystem_dashboard_${timestamp}.html`);
        
        return { reportPath, resultsDir, timestamp, report };
    }

    // 生成CSV文件
    async generateCSVFiles(resultsDir, timestamp) {
        // 时间序列数据
        const timeSeriesCSV = [
            'timestamp,totalOrders,successRate,averagePrice,averageExecutionTime,activeAgents,totalDeposits',
            ...this.timeSeriesData.map(d => 
                `${d.timestamp},${d.overall.totalOrders},${d.overall.successRate},${d.overall.averagePrice},${d.overall.averageExecutionTime},${d.overall.activeAgents},${d.overall.totalDeposits}`
            )
        ].join('\n');
        fs.writeFileSync(path.join(resultsDir, `timeseries_${timestamp}.csv`), timeSeriesCSV);
        
        // Agent表现数据
        const agentCSV = [
            'agentId,deposit,totalOrders,successRate,reputation,efficiency',
            ...this.agents.map(a => 
                `${a.id},${a.deposit},${a.totalOrders},${a.currentSuccessRate},${a.reputation},${a.totalOrders / this.config.simulationDuration}`
            )
        ].join('\n');
        fs.writeFileSync(path.join(resultsDir, `agents_${timestamp}.csv`), agentCSV);
        
        // 订单明细数据
        const ordersCSV = [
            'orderId,userId,agentId,taskType,difficulty,createdAt,status,actualPrice,executionTime',
            ...this.orders.map(o => 
                `${o.id},${o.userId},${o.agentId || 'N/A'},${o.taskType},${o.difficulty},${o.createdAt},${o.status},${o.actualPrice || 0},${o.executionTime || 0}`
            )
        ].join('\n');
        fs.writeFileSync(path.join(resultsDir, `orders_${timestamp}.csv`), ordersCSV);
    }

    // 生成HTML可视化页面
    async generateVisualization(resultsDir, timestamp, report) {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Agent Platform - 生态系统模拟报告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .chart-container canvas { max-height: 400px; }
        .top-agents { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .agent-row { display: grid; grid-template-columns: 1fr 100px 100px 100px 100px; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; }
        .agent-header { font-weight: bold; background: #f8f8f8; padding: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 AI Agent Platform 生态系统模拟报告</h1>
            <p><strong>模拟时长:</strong> ${report.metadata.simulationDuration} 分钟 | 
               <strong>Agent数量:</strong> ${report.metadata.agentCount} | 
               <strong>用户数量:</strong> ${report.metadata.userCount}</p>
            <p><strong>生成时间:</strong> ${report.metadata.generatedAt}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalOrders}</div>
                <div class="metric-label">总订单数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(report.summary.overallSuccessRate * 100).toFixed(1)}%</div>
                <div class="metric-label">整体成功率</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalVolume.toFixed(3)} ETH</div>
                <div class="metric-label">总交易量</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.averageOrderValue.toFixed(4)} ETH</div>
                <div class="metric-label">平均订单价值</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(report.performance.averageExecutionTime / 1000).toFixed(1)}s</div>
                <div class="metric-label">平均执行时间</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.performance.systemThroughput.toFixed(1)}</div>
                <div class="metric-label">系统吞吐量 (订单/分钟)</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>📈 时间序列 - 成功率与订单量</h3>
            <canvas id="timeSeriesChart"></canvas>
        </div>
        
        <div class="chart-container">
            <h3>🤖 Agent表现分布</h3>
            <canvas id="agentPerformanceChart"></canvas>
        </div>
        
        <div class="top-agents">
            <h3>🏆 Top 10 Agent表现</h3>
            <div class="agent-row agent-header">
                <div>Agent ID</div>
                <div>抵押 (ETH)</div>
                <div>订单数</div>
                <div>成功率</div>
                <div>信誉分</div>
            </div>
            ${report.agentAnalysis.topByVolume.slice(0, 10).map(agent => `
                <div class="agent-row">
                    <div>${agent.id}</div>
                    <div>${agent.deposit.toFixed(3)}</div>
                    <div>${agent.totalOrders}</div>
                    <div>${(agent.successRate * 100).toFixed(1)}%</div>
                    <div>${agent.reputation.toFixed(1)}</div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        // 时间序列图表
        const timeSeriesCtx = document.getElementById('timeSeriesChart').getContext('2d');
        const timeSeriesData = ${JSON.stringify(this.timeSeriesData)};
        
        new Chart(timeSeriesCtx, {
            type: 'line',
            data: {
                labels: timeSeriesData.map(d => d.timestamp + 'min'),
                datasets: [{
                    label: '成功率 (%)',
                    data: timeSeriesData.map(d => d.overall.successRate * 100),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    yAxisID: 'y'
                }, {
                    label: '订单数',
                    data: timeSeriesData.map(d => d.overall.totalOrders),
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: '成功率 (%)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: '订单数' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
        
        // Agent表现图表
        const agentCtx = document.getElementById('agentPerformanceChart').getContext('2d');
        const agentData = ${JSON.stringify(report.agentAnalysis.all)};
        
        new Chart(agentCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Agent表现',
                    data: agentData.map(agent => ({
                        x: agent.deposit,
                        y: agent.successRate * 100,
                        r: Math.sqrt(agent.totalOrders) * 2
                    })),
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: '#4CAF50'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: '抵押金 (ETH)' } },
                    y: { title: { display: true, text: '成功率 (%)' } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const agent = agentData[context.dataIndex];
                                return \`\${agent.id}: 抵押 \${agent.deposit}ETH, 成功率 \${(agent.successRate*100).toFixed(1)}%, 订单 \${agent.totalOrders}\`;
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(resultsDir, `ecosystem_dashboard_${timestamp}.html`), htmlContent);
    }

    // 工具函数
    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }
    
    sampleArray(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    calculatePercentile(arr, percentile) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile / 100) - 1;
        return sorted[index];
    }
}

// CLI执行
if (require.main === module) {
    const config = {
        agentCount: 30,        // 30个Agent
        userCount: 80,         // 80个用户
        simulationDuration: 120, // 2小时模拟
        timeInterval: 10,      // 每10分钟记录数据
        orderFrequency: 3      // 每用户每分钟3个订单
    };
    
    console.log('🚀 启动生态系统模拟测试...');
    
    const simulator = new EcosystemSimulator(config);
    simulator.runSimulation().then(async () => {
        const results = await simulator.saveResults();
        
        console.log('\n🎉 模拟测试完成!');
        console.log(`📊 查看详细报告: ${results.reportPath}`);
        console.log(`🌐 打开可视化页面: ${results.resultsDir}/ecosystem_dashboard_${results.timestamp}.html`);
        console.log('\n主要结果:');
        console.log(`   总订单: ${results.report.summary.totalOrders}`);
        console.log(`   成功率: ${(results.report.summary.overallSuccessRate * 100).toFixed(1)}%`);
        console.log(`   交易量: ${results.report.summary.totalVolume.toFixed(3)} ETH`);
        console.log(`   平均执行时间: ${(results.report.performance.averageExecutionTime / 1000).toFixed(1)}s`);
        
    }).catch(error => {
        console.error('❌ 模拟失败:', error);
        process.exit(1);
    });
}

module.exports = EcosystemSimulator;