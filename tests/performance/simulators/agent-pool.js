/**
 * 🤖 Agent池模拟器
 * Agent Pool Simulator for Performance Testing
 * 
 * 功能：
 * - 模拟多个具有不同特性的Agent
 * - 动态信誉评分系统
 * - 智能负载分配
 * - 真实业务行为模拟
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class AgentPool extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            count: config.count || 100,
            minDeposit: config.minDeposit || 0.1,
            maxDeposit: config.maxDeposit || 5.0,
            minSuccessRate: config.minSuccessRate || 0.6,
            maxSuccessRate: config.maxSuccessRate || 0.95,
            specialtyTypes: config.specialtyTypes || ['ai_inference', 'data_processing', 'content_creation']
        };
        
        this.agents = [];
        this.totalOrders = 0;
        this.totalCompletedOrders = 0;
        
        console.log('🤖 Agent池模拟器初始化中...'.yellow);
        this.initializeAgents();
    }

    // 初始化Agent池
    initializeAgents() {
        console.log(`📊 生成${this.config.count}个Agent...`.gray);
        
        for (let i = 0; i < this.config.count; i++) {
            const agent = this.createAgent(i);
            this.agents.push(agent);
        }
        
        // 按抵押金排序
        this.agents.sort((a, b) => b.deposit - a.deposit);
        
        // 显示统计信息
        this.logAgentStats();
    }

    // 创建单个Agent
    createAgent(index) {
        const baseSuccessRate = this.config.minSuccessRate + 
            Math.random() * (this.config.maxSuccessRate - this.config.minSuccessRate);
        
        const deposit = this.config.minDeposit + 
            Math.random() * (this.config.maxDeposit - this.config.minDeposit);
        
        const specialties = this.generateSpecialties();
        
        return {
            id: `agent_${index.toString().padStart(3, '0')}`,
            address: this.generateAddress(),
            
            // 静态属性
            deposit: parseFloat(deposit.toFixed(4)),
            baseSuccessRate: parseFloat(baseSuccessRate.toFixed(3)),
            specialties: specialties,
            joinedAt: Date.now() - Math.random() * 86400000 * 30, // 30天内随机加入
            
            // 动态统计
            totalOrders: 0,
            completedOrders: 0,
            failedOrders: 0,
            currentSuccessRate: baseSuccessRate,
            averageCompletionTime: this.generateCompletionTime(),
            totalEarnings: 0,
            
            // 信誉系统
            reputation: baseSuccessRate * 100,
            reputationHistory: [baseSuccessRate * 100],
            lastReputationUpdate: Date.now(),
            
            // 容量管理
            maxConcurrentOrders: Math.floor(Math.random() * 5 + 3), // 3-7
            currentLoad: 0,
            availableCapacity: function() { return this.maxConcurrentOrders - this.currentLoad; },
            
            // 状态
            isActive: Math.random() > 0.1, // 90%概率在线
            lastActiveTime: Date.now(),
            performanceVariability: Math.random() * 0.2 + 0.1, // 10-30%变异
            
            // 经济模型
            pricing: {
                baseFee: Math.random() * 0.01 + 0.005, // 0.005-0.015 ETH
                difficultyMultiplier: 1 + Math.random() * 2, // 1-3x
                urgencyMultiplier: 1 + Math.random() * 1.5 // 1-2.5x
            }
        };
    }

    // 生成专业技能
    generateSpecialties() {
        const numSpecialties = Math.floor(Math.random() * 3) + 1; // 1-3个专长
        const selected = [];
        const available = [...this.config.specialtyTypes];
        
        for (let i = 0; i < numSpecialties && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            selected.push(available.splice(index, 1)[0]);
        }
        
        return selected;
    }

    // 生成地址
    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }

    // 生成完成时间
    generateCompletionTime() {
        // 基础时间8-20秒，根据Agent质量调整
        const baseTime = 8000 + Math.random() * 12000;
        return Math.floor(baseTime);
    }

    // 获取Agent统计信息
    getAgentStats() {
        return {
            total: this.agents.length,
            active: this.agents.filter(a => a.isActive).length,
            totalCapacity: this.agents.reduce((sum, a) => sum + a.maxConcurrentOrders, 0),
            currentLoad: this.agents.reduce((sum, a) => sum + a.currentLoad, 0),
            avgDeposit: this.agents.reduce((sum, a) => sum + a.deposit, 0) / this.agents.length,
            avgReputation: this.agents.reduce((sum, a) => sum + a.reputation, 0) / this.agents.length,
            totalEarnings: this.agents.reduce((sum, a) => sum + a.totalEarnings, 0)
        };
    }

    // 智能选择Agent
    selectAgent(orderRequirements = {}) {
        const availableAgents = this.agents.filter(agent => 
            agent.isActive && 
            agent.availableCapacity() > 0 &&
            this.matchesRequirements(agent, orderRequirements)
        );

        if (availableAgents.length === 0) {
            return null;
        }

        // 按评分排序（用户倾向选择高评分Agent）
        availableAgents.sort((a, b) => {
            const scoreA = this.calculateAgentScore(a, orderRequirements);
            const scoreB = this.calculateAgentScore(b, orderRequirements);
            return scoreB - scoreA;
        });

        // 前20%概率选择最优，80%概率在前50%中随机选择
        const topTierSize = Math.max(1, Math.floor(availableAgents.length * 0.2));
        const midTierSize = Math.max(1, Math.floor(availableAgents.length * 0.5));
        
        if (Math.random() < 0.2) {
            // 选择最优
            return availableAgents[Math.floor(Math.random() * topTierSize)];
        } else {
            // 在前50%中选择
            return availableAgents[Math.floor(Math.random() * midTierSize)];
        }
    }

    // 检查Agent是否匹配要求
    matchesRequirements(agent, requirements) {
        if (requirements.specialty && !agent.specialties.includes(requirements.specialty)) {
            return false;
        }
        if (requirements.minReputation && agent.reputation < requirements.minReputation) {
            return false;
        }
        if (requirements.maxPrice && agent.pricing.baseFee > requirements.maxPrice) {
            return false;
        }
        return true;
    }

    // 计算Agent评分
    calculateAgentScore(agent, requirements = {}) {
        let score = 0;
        
        // 信誉权重40%
        score += (agent.reputation / 100) * 40;
        
        // 抵押金权重20%
        const depositScore = Math.min(agent.deposit / this.config.maxDeposit, 1);
        score += depositScore * 20;
        
        // 成功率权重25%
        score += agent.currentSuccessRate * 25;
        
        // 可用性权重10%
        const availabilityScore = agent.availableCapacity() / agent.maxConcurrentOrders;
        score += availabilityScore * 10;
        
        // 响应时间权重5%
        const responseScore = Math.max(0, 1 - (agent.averageCompletionTime / 30000));
        score += responseScore * 5;
        
        return score;
    }

    // 分配订单给Agent
    assignOrder(agent, order) {
        if (!agent.isActive || agent.availableCapacity() <= 0) {
            return false;
        }

        agent.currentLoad++;
        agent.totalOrders++;
        this.totalOrders++;

        this.emit('orderAssigned', { agent, order });
        
        // 模拟订单处理
        setTimeout(() => {
            this.completeOrder(agent, order);
        }, agent.averageCompletionTime + Math.random() * 5000);

        return true;
    }

    // 完成订单
    completeOrder(agent, order) {
        agent.currentLoad--;
        
        // 根据Agent特性决定成功/失败
        const success = Math.random() < agent.currentSuccessRate;
        
        if (success) {
            agent.completedOrders++;
            this.totalCompletedOrders++;
            
            // 计算收益
            const earnings = order.payment || (agent.pricing.baseFee * (1 + Math.random() * 0.5));
            agent.totalEarnings += earnings;
            
            this.emit('orderCompleted', { agent, order, success: true, earnings });
        } else {
            agent.failedOrders++;
            this.emit('orderCompleted', { agent, order, success: false });
        }

        // 更新Agent统计
        this.updateAgentStats(agent);
    }

    // 更新Agent统计数据
    updateAgentStats(agent) {
        // 更新成功率（基于最近表现）
        if (agent.totalOrders > 0) {
            const recentSuccessRate = agent.completedOrders / agent.totalOrders;
            agent.currentSuccessRate = (agent.baseSuccessRate * 0.3 + recentSuccessRate * 0.7);
        }

        // 更新信誉值
        const oldReputation = agent.reputation;
        agent.reputation = Math.max(0, Math.min(100, 
            agent.reputation + (agent.currentSuccessRate - 0.8) * 10
        ));

        // 记录信誉历史
        if (Math.abs(agent.reputation - oldReputation) > 0.1) {
            agent.reputationHistory.push(agent.reputation);
            if (agent.reputationHistory.length > 100) {
                agent.reputationHistory.shift();
            }
        }

        agent.lastReputationUpdate = Date.now();
    }

    // 模拟Agent状态变化
    simulateAgentBehavior() {
        for (const agent of this.agents) {
            // 随机上下线
            if (Math.random() < 0.001) { // 0.1%概率状态变化
                agent.isActive = !agent.isActive;
                agent.lastActiveTime = Date.now();
                this.emit('agentStatusChanged', { agent });
            }

            // 性能波动
            if (Math.random() < 0.01) { // 1%概率性能调整
                const variation = (Math.random() - 0.5) * agent.performanceVariability;
                agent.currentSuccessRate = Math.max(0.1, Math.min(0.99, 
                    agent.baseSuccessRate + variation
                ));
            }
        }
    }

    // 获取实时统计
    getRealTimeStats() {
        const stats = this.getAgentStats();
        return {
            ...stats,
            timestamp: Date.now(),
            totalOrders: this.totalOrders,
            completedOrders: this.totalCompletedOrders,
            successRate: this.totalOrders > 0 ? this.totalCompletedOrders / this.totalOrders : 0,
            systemLoad: stats.currentLoad / stats.totalCapacity
        };
    }

    // 记录Agent统计
    logAgentStats() {
        const stats = this.getAgentStats();
        console.log('✅ Agent池初始化完成'.green);
        console.log(`   总数量: ${stats.total}`.gray);
        console.log(`   在线数: ${stats.active}`.gray);
        console.log(`   总容量: ${stats.totalCapacity}订单`.gray);
        console.log(`   平均抵押: ${stats.avgDeposit.toFixed(3)} ETH`.gray);
        console.log(`   平均信誉: ${stats.avgReputation.toFixed(1)}分`.gray);
    }

    // 获取顶级Agent
    getTopAgents(limit = 10) {
        return this.agents
            .sort((a, b) => b.reputation - a.reputation)
            .slice(0, limit)
            .map(agent => ({
                id: agent.id,
                reputation: agent.reputation,
                deposit: agent.deposit,
                successRate: agent.currentSuccessRate,
                totalOrders: agent.totalOrders,
                totalEarnings: agent.totalEarnings
            }));
    }

    // 导出数据
    exportData() {
        return {
            config: this.config,
            totalAgents: this.agents.length,
            stats: this.getRealTimeStats(),
            agents: this.agents.map(agent => ({
                ...agent,
                availableCapacity: agent.availableCapacity()
            })),
            timestamp: Date.now()
        };
    }
}

module.exports = AgentPool;