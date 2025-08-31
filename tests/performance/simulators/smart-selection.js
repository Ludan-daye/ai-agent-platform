/**
 * 🎯 智能Agent选择算法
 * Advanced Smart Agent Selection Algorithm
 * 
 * 功能：
 * - 多维度评分系统
 * - 机器学习预测
 * - 动态负载均衡 
 * - 用户偏好学习
 * - 实时性能优化
 */

const EventEmitter = require('events');

class SmartAgentSelector extends EventEmitter {
    constructor(strategy = 'adaptive') {
        super();
        this.strategy = strategy;
        this.selectionHistory = [];
        this.performanceMetrics = new Map();
        this.userPreferences = new Map();
        this.agentLoadHistory = new Map();
        this.marketDynamics = {
            demandSupplyRatio: 1.0,
            averagePrice: 0.01,
            priceVolatility: 0.1,
            congestionLevel: 0.0
        };
        
        // 算法配置
        this.config = {
            weights: {
                reputation: 0.25,      // 信誉权重
                deposit: 0.15,         // 抵押金权重  
                successRate: 0.20,     // 成功率权重
                availability: 0.15,    // 可用性权重
                responseTime: 0.10,    // 响应时间权重
                pricing: 0.10,         // 价格竞争力权重
                userPreference: 0.05   // 用户偏好权重
            },
            selectionStrategies: {
                greedy: 0.2,       // 20%概率选择最优
                balanced: 0.6,     // 60%概率在前50%中选择  
                exploration: 0.2   // 20%概率探索性选择
            },
            learningRate: 0.1,
            decayFactor: 0.95,
            minSampleSize: 10
        };
        
        console.log(`🎯 智能Agent选择算法初始化 (策略: ${strategy})`.yellow);
        this.initializeAlgorithm();
    }

    // 初始化算法
    initializeAlgorithm() {
        // 启动市场动态监控
        this.startMarketMonitoring();
        
        // 初始化性能追踪
        this.startPerformanceTracking();
        
        console.log('✅ 智能选择算法初始化完成'.green);
    }

    // 主要选择函数
    selectAgent(availableAgents, orderRequirements, userContext = {}) {
        if (!availableAgents || availableAgents.length === 0) {
            return null;
        }

        // 1. 预筛选合格Agent
        const eligibleAgents = this.filterEligibleAgents(availableAgents, orderRequirements);
        if (eligibleAgents.length === 0) {
            return null;
        }

        // 2. 计算综合评分
        const scoredAgents = this.calculateAgentScores(eligibleAgents, orderRequirements, userContext);
        
        // 3. 应用选择策略
        const selectedAgent = this.applySelectionStrategy(scoredAgents, orderRequirements, userContext);
        
        // 4. 记录选择结果
        this.recordSelection(selectedAgent, orderRequirements, userContext, scoredAgents);
        
        // 5. 更新学习模型
        this.updateLearningModel(selectedAgent, orderRequirements, userContext);
        
        return selectedAgent;
    }

    // 预筛选合格Agent
    filterEligibleAgents(agents, requirements) {
        return agents.filter(agent => {
            // 基本可用性检查
            if (!agent.isActive || agent.availableCapacity() <= 0) {
                return false;
            }
            
            // 专业技能匹配
            if (requirements.specialty && !agent.specialties.includes(requirements.specialty)) {
                return false;
            }
            
            // 最低信誉要求
            if (requirements.minReputation && agent.reputation < requirements.minReputation) {
                return false;
            }
            
            // 最大价格限制
            if (requirements.maxPrice && agent.pricing.baseFee > requirements.maxPrice) {
                return false;
            }
            
            // 检查用户黑名单
            const userId = requirements.userId || 'anonymous';
            const userPrefs = this.userPreferences.get(userId);
            if (userPrefs && userPrefs.blacklistedAgents && userPrefs.blacklistedAgents.includes(agent.id)) {
                return false;
            }
            
            return true;
        });
    }

    // 计算Agent综合评分
    calculateAgentScores(agents, requirements, userContext) {
        const userId = userContext.userId || requirements.userId || 'anonymous';
        const userPrefs = this.userPreferences.get(userId) || { preferences: {}, agentRatings: new Map() };
        
        return agents.map(agent => {
            const scores = {};
            
            // 1. 信誉评分 (0-100)
            scores.reputation = this.calculateReputationScore(agent, requirements);
            
            // 2. 抵押金评分 (0-100) 
            scores.deposit = this.calculateDepositScore(agent, requirements);
            
            // 3. 成功率评分 (0-100)
            scores.successRate = this.calculateSuccessRateScore(agent, requirements);
            
            // 4. 可用性评分 (0-100)
            scores.availability = this.calculateAvailabilityScore(agent, requirements);
            
            // 5. 响应时间评分 (0-100)
            scores.responseTime = this.calculateResponseTimeScore(agent, requirements);
            
            // 6. 价格竞争力评分 (0-100)
            scores.pricing = this.calculatePricingScore(agent, requirements);
            
            // 7. 用户偏好评分 (0-100)
            scores.userPreference = this.calculateUserPreferenceScore(agent, userPrefs, requirements);
            
            // 8. 负载均衡调整
            scores.loadBalance = this.calculateLoadBalanceScore(agent, requirements);
            
            // 计算加权总分
            const totalScore = 
                scores.reputation * this.config.weights.reputation +
                scores.deposit * this.config.weights.deposit +
                scores.successRate * this.config.weights.successRate +
                scores.availability * this.config.weights.availability +
                scores.responseTime * this.config.weights.responseTime +
                scores.pricing * this.config.weights.pricing +
                scores.userPreference * this.config.weights.userPreference;
            
            // 应用负载均衡调整
            const adjustedScore = totalScore * (1 + scores.loadBalance * 0.1);
            
            return {
                agent,
                scores,
                totalScore: Math.max(0, Math.min(100, adjustedScore)),
                confidence: this.calculateConfidence(agent, requirements)
            };
        }).sort((a, b) => b.totalScore - a.totalScore);
    }

    // 信誉评分计算
    calculateReputationScore(agent, requirements) {
        let score = agent.reputation;
        
        // 考虑信誉历史趋势
        if (agent.reputationHistory && agent.reputationHistory.length > 1) {
            const recent = agent.reputationHistory.slice(-5);
            const trend = recent[recent.length - 1] - recent[0];
            score += trend * 0.1; // 趋势影响
        }
        
        // 考虑样本大小
        const experienceBonus = Math.min(10, agent.totalOrders / 10);
        score += experienceBonus;
        
        return Math.max(0, Math.min(100, score));
    }

    // 抵押金评分计算
    calculateDepositScore(agent, requirements) {
        const maxDeposit = 5.0; // 假设最大抵押金
        const normalizedDeposit = Math.min(agent.deposit / maxDeposit, 1);
        
        // 非线性评分，抵押金越高，边际收益递减
        const score = Math.pow(normalizedDeposit, 0.7) * 100;
        
        return Math.max(0, Math.min(100, score));
    }

    // 成功率评分计算
    calculateSuccessRateScore(agent, requirements) {
        let score = agent.currentSuccessRate * 100;
        
        // 考虑相关专业领域的成功率
        if (requirements.specialty && agent.specialtyPerformance) {
            const specialtyRate = agent.specialtyPerformance[requirements.specialty] || agent.currentSuccessRate;
            score = (score + specialtyRate * 100) / 2;
        }
        
        // 惩罚最近的失败
        const recentFailures = this.getRecentFailures(agent.id);
        score *= Math.max(0.5, 1 - recentFailures * 0.1);
        
        return Math.max(0, Math.min(100, score));
    }

    // 可用性评分计算  
    calculateAvailabilityScore(agent, requirements) {
        const capacityRatio = agent.availableCapacity() / agent.maxConcurrentOrders;
        let score = capacityRatio * 80; // 基础分80分
        
        // 考虑历史负载模式
        const avgLoad = this.getAverageLoad(agent.id);
        if (avgLoad < 0.7) {
            score += 20; // 低负载奖励
        }
        
        // 考虑紧急订单优先级
        if (requirements.urgency === 'high' && capacityRatio > 0.5) {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // 响应时间评分计算
    calculateResponseTimeScore(agent, requirements) {
        const maxTime = 30000; // 30秒最大响应时间
        const normalizedTime = Math.min(agent.averageCompletionTime / maxTime, 1);
        
        let score = (1 - normalizedTime) * 100;
        
        // 紧急订单对响应时间更敏感
        if (requirements.urgency === 'high') {
            score = Math.pow(score / 100, 2) * 100;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // 价格竞争力评分计算
    calculatePricingScore(agent, requirements) {
        const agentPrice = this.calculateEstimatedPrice(agent, requirements);
        const marketAvgPrice = this.marketDynamics.averagePrice;
        
        // 价格越低分数越高
        const priceRatio = Math.min(agentPrice / marketAvgPrice, 2);
        let score = Math.max(0, (2 - priceRatio) * 50);
        
        // 但要避免过度低价竞争
        if (priceRatio < 0.5) {
            score *= 0.8; // 异常低价惩罚
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // 用户偏好评分计算
    calculateUserPreferenceScore(agent, userPrefs, requirements) {
        let score = 50; // 基础分
        
        // 用户历史评价
        if (userPrefs.agentRatings && userPrefs.agentRatings.has(agent.id)) {
            const rating = userPrefs.agentRatings.get(agent.id);
            score = rating;
        }
        
        // 收藏Agent奖励
        if (userPrefs.favoriteAgents && userPrefs.favoriteAgents.includes(agent.id)) {
            score += 30;
        }
        
        // 考虑用户类型偏好
        if (requirements.userType && userPrefs.preferences) {
            const typePrefs = userPrefs.preferences[requirements.userType] || {};
            if (typePrefs.preferredAgents && typePrefs.preferredAgents.includes(agent.id)) {
                score += 20;
            }
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // 负载均衡评分计算
    calculateLoadBalanceScore(agent, requirements) {
        const systemLoad = this.marketDynamics.congestionLevel;
        const agentLoad = agent.currentLoad / agent.maxConcurrentOrders;
        
        // 系统负载高时，优先选择低负载Agent
        if (systemLoad > 0.7) {
            return (1 - agentLoad) * 20;
        }
        
        // 正常情况下轻微平衡
        return (1 - agentLoad) * 5;
    }

    // 应用选择策略
    applySelectionStrategy(scoredAgents, requirements, userContext) {
        const strategy = this.determineStrategy(requirements, userContext);
        const random = Math.random();
        
        switch (strategy) {
            case 'greedy':
                // 选择最高分Agent
                return scoredAgents[0].agent;
                
            case 'balanced':
                // 在前50%中随机选择
                const topHalf = Math.max(1, Math.floor(scoredAgents.length * 0.5));
                const index = Math.floor(Math.random() * topHalf);
                return scoredAgents[index].agent;
                
            case 'exploration':
                // 探索性选择：基于分数的概率选择
                return this.probabilisticSelection(scoredAgents);
                
            case 'adaptive':
            default:
                // 自适应策略
                if (random < this.config.selectionStrategies.greedy) {
                    return scoredAgents[0].agent;
                } else if (random < this.config.selectionStrategies.greedy + this.config.selectionStrategies.balanced) {
                    const topHalf = Math.max(1, Math.floor(scoredAgents.length * 0.5));
                    const index = Math.floor(Math.random() * topHalf);
                    return scoredAgents[index].agent;
                } else {
                    return this.probabilisticSelection(scoredAgents);
                }
        }
    }

    // 概率选择
    probabilisticSelection(scoredAgents) {
        const totalScore = scoredAgents.reduce((sum, sa) => sum + Math.max(1, sa.totalScore), 0);
        let random = Math.random() * totalScore;
        
        for (const scoredAgent of scoredAgents) {
            random -= Math.max(1, scoredAgent.totalScore);
            if (random <= 0) {
                return scoredAgent.agent;
            }
        }
        
        return scoredAgents[0].agent; // fallback
    }

    // 确定选择策略
    determineStrategy(requirements, userContext) {
        // 紧急订单使用贪婪策略
        if (requirements.urgency === 'high') {
            return 'greedy';
        }
        
        // 企业用户偏好可靠性
        if (requirements.userType === 'enterprise') {
            return 'balanced';
        }
        
        // 新用户使用探索策略
        const userId = userContext.userId || requirements.userId;
        if (userId && this.isNewUser(userId)) {
            return 'exploration';
        }
        
        return this.strategy;
    }

    // 记录选择结果
    recordSelection(agent, requirements, userContext, allScores) {
        const record = {
            timestamp: Date.now(),
            agentId: agent.id,
            requirements: requirements,
            userContext: userContext,
            scores: allScores.find(s => s.agent.id === agent.id)?.scores || {},
            selectionReason: this.getSelectionReason(agent, allScores)
        };
        
        this.selectionHistory.push(record);
        
        // 限制历史记录大小
        if (this.selectionHistory.length > 10000) {
            this.selectionHistory = this.selectionHistory.slice(-5000);
        }
        
        this.emit('agentSelected', record);
    }

    // 更新学习模型
    updateLearningModel(agent, requirements, userContext) {
        const userId = userContext.userId || requirements.userId || 'anonymous';
        
        // 更新用户偏好模型
        if (!this.userPreferences.has(userId)) {
            this.userPreferences.set(userId, {
                preferences: {},
                agentRatings: new Map(),
                selectionHistory: []
            });
        }
        
        const userPrefs = this.userPreferences.get(userId);
        userPrefs.selectionHistory.push({
            agentId: agent.id,
            timestamp: Date.now(),
            requirements: requirements
        });
        
        // 更新市场动态
        this.updateMarketDynamics(agent, requirements);
        
        // 调整算法权重（自适应学习）
        this.adaptAlgorithmWeights();
    }

    // 更新市场动态
    updateMarketDynamics(agent, requirements) {
        // 更新平均价格
        const estimatedPrice = this.calculateEstimatedPrice(agent, requirements);
        this.marketDynamics.averagePrice = 
            this.marketDynamics.averagePrice * 0.9 + estimatedPrice * 0.1;
        
        // 更新拥堵水平
        const currentLoad = this.calculateSystemLoad();
        this.marketDynamics.congestionLevel = 
            this.marketDynamics.congestionLevel * 0.95 + currentLoad * 0.05;
    }

    // 启动市场监控
    startMarketMonitoring() {
        setInterval(() => {
            this.updateMarketMetrics();
        }, 30000); // 每30秒更新
    }

    // 启动性能追踪
    startPerformanceTracking() {
        setInterval(() => {
            this.trackPerformance();
        }, 10000); // 每10秒追踪
    }

    // 辅助方法
    calculateEstimatedPrice(agent, requirements) {
        let price = agent.pricing.baseFee;
        
        if (requirements.urgency === 'high') {
            price *= agent.pricing.urgencyMultiplier;
        }
        
        if (requirements.difficulty) {
            price *= agent.pricing.difficultyMultiplier;
        }
        
        return price;
    }

    calculateSystemLoad() {
        // 这里应该从外部系统获取，这里用模拟值
        return Math.random() * 0.8; // 0-80%负载
    }

    getRecentFailures(agentId) {
        // 模拟获取最近失败次数
        return Math.floor(Math.random() * 3);
    }

    getAverageLoad(agentId) {
        // 模拟获取平均负载
        return Math.random() * 0.8;
    }

    isNewUser(userId) {
        const userPrefs = this.userPreferences.get(userId);
        return !userPrefs || userPrefs.selectionHistory.length < 5;
    }

    getSelectionReason(agent, allScores) {
        const selected = allScores.find(s => s.agent.id === agent.id);
        const maxScore = Math.max(...allScores.map(s => s.totalScore));
        
        if (selected.totalScore === maxScore) {
            return 'highest_score';
        } else if (selected.totalScore > maxScore * 0.9) {
            return 'balanced_selection';
        } else {
            return 'exploration';
        }
    }

    calculateConfidence(agent, requirements) {
        // 基于历史表现和样本大小计算置信度
        const sampleSize = Math.min(agent.totalOrders, 100);
        const baseConfidence = sampleSize / 100;
        
        // 专业匹配度影响置信度
        const specialtyMatch = requirements.specialty && 
            agent.specialties.includes(requirements.specialty) ? 1.0 : 0.8;
        
        return Math.min(1.0, baseConfidence * specialtyMatch);
    }

    updateMarketMetrics() {
        // 更新市场指标的模拟实现
        this.marketDynamics.priceVolatility = 
            Math.max(0.05, this.marketDynamics.priceVolatility * 0.98 + Math.random() * 0.02);
    }

    trackPerformance() {
        // 性能追踪的模拟实现
        const recent = this.selectionHistory.slice(-100);
        // 分析选择效果，调整策略参数
    }

    adaptAlgorithmWeights() {
        // 基于历史表现自适应调整权重
        // 这里是简化版本，实际应该基于反馈学习
        const learningRate = this.config.learningRate;
        
        // 模拟权重微调
        Object.keys(this.config.weights).forEach(key => {
            const adjustment = (Math.random() - 0.5) * learningRate * 0.1;
            this.config.weights[key] = Math.max(0, Math.min(1, 
                this.config.weights[key] + adjustment
            ));
        });
        
        // 归一化权重
        const sum = Object.values(this.config.weights).reduce((a, b) => a + b, 0);
        Object.keys(this.config.weights).forEach(key => {
            this.config.weights[key] /= sum;
        });
    }

    // 获取算法统计
    getAlgorithmStats() {
        const recent = this.selectionHistory.slice(-1000);
        
        return {
            totalSelections: this.selectionHistory.length,
            recentSelections: recent.length,
            averageConfidence: recent.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / recent.length,
            strategyDistribution: this.getStrategyDistribution(recent),
            userPreferenceCount: this.userPreferences.size,
            marketDynamics: { ...this.marketDynamics },
            currentWeights: { ...this.config.weights },
            timestamp: Date.now()
        };
    }

    getStrategyDistribution(records) {
        const distribution = { greedy: 0, balanced: 0, exploration: 0 };
        
        records.forEach(r => {
            if (r.selectionReason === 'highest_score') {
                distribution.greedy++;
            } else if (r.selectionReason === 'balanced_selection') {
                distribution.balanced++;
            } else {
                distribution.exploration++;
            }
        });
        
        return distribution;
    }

    // 导出数据
    exportData() {
        return {
            config: this.config,
            stats: this.getAlgorithmStats(),
            selectionHistory: this.selectionHistory.slice(-1000), // 最近1000条
            userPreferences: Object.fromEntries(
                Array.from(this.userPreferences.entries()).map(([userId, prefs]) => [
                    userId,
                    {
                        ...prefs,
                        agentRatings: Object.fromEntries(prefs.agentRatings)
                    }
                ])
            ),
            marketDynamics: this.marketDynamics,
            timestamp: Date.now()
        };
    }
}

module.exports = SmartAgentSelector;