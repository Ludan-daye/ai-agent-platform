/**
 * 👥 用户行为模拟器
 * User Behavior Simulator for Performance Testing
 * 
 * 功能：
 * - 10000+并发用户模拟
 * - 真实用户行为模式
 * - 智能Agent选择倾向
 * - 多种订单类型和频率
 * - 用户群体分层模拟
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class UserBehaviorSimulator extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            count: config.count || 10000,
            orderFrequency: config.orderFrequency || 2, // orders per minute per user
            selectionStrategy: config.selectionStrategy || 'smart',
            behaviorPatterns: config.behaviorPatterns || ['burst', 'steady', 'random'],
            // 新增配置
            userTypes: ['casual', 'professional', 'enterprise'],
            orderTypes: ['ai_inference', 'data_processing', 'content_creation', 'computation', 'analysis'],
            maxConcurrentOrders: 5, // 每用户最大并发订单
            sessionDuration: { min: 300000, max: 3600000 } // 5分钟到1小时会话
        };
        
        this.users = [];
        this.activeUsers = new Set();
        this.orderQueue = [];
        this.totalOrdersCreated = 0;
        this.totalOrdersCompleted = 0;
        this.isRunning = false;
        
        // 行为统计
        this.behaviorStats = {
            totalSessions: 0,
            activeSessions: 0,
            ordersPerSecond: 0,
            avgSessionDuration: 0
        };
        
        console.log('👥 用户行为模拟器初始化中...'.yellow);
        this.initializeUsers();
    }

    // 初始化用户群体
    initializeUsers() {
        console.log(`👤 生成${this.config.count}个用户...`.gray);
        
        for (let i = 0; i < this.config.count; i++) {
            const user = this.createUser(i);
            this.users.push(user);
        }
        
        // 用户群体分析
        this.analyzeUserDemographics();
    }

    // 创建单个用户
    createUser(index) {
        const userType = this.config.userTypes[Math.floor(Math.random() * this.config.userTypes.length)];
        const preferredOrderTypes = this.selectPreferredOrderTypes();
        
        return {
            id: `user_${index.toString().padStart(5, '0')}`,
            address: this.generateAddress(),
            type: userType,
            
            // 用户特征
            agentPreference: this.generateAgentPreference(userType),
            budgetRange: this.generateBudgetRange(userType),
            preferredOrderTypes: preferredOrderTypes,
            
            // 行为模式
            behaviorPattern: this.config.behaviorPatterns[Math.floor(Math.random() * this.config.behaviorPatterns.length)],
            activityLevel: this.generateActivityLevel(userType),
            orderFrequency: this.adjustOrderFrequency(userType),
            
            // 会话管理
            isOnline: false,
            sessionStartTime: null,
            sessionDuration: 0,
            maxSessionDuration: this.generateSessionDuration(),
            
            // 订单历史
            totalOrders: 0,
            completedOrders: 0,
            canceledOrders: 0,
            totalSpent: 0,
            
            // 当前状态
            currentOrders: [],
            lastOrderTime: 0,
            nextOrderTime: 0,
            
            // 偏好学习
            agentRatings: new Map(), // agentId -> rating
            favoriteAgents: [],
            blacklistedAgents: [],
            
            // 质量要求
            qualityThreshold: 0.6 + Math.random() * 0.3, // 60-90%质量要求
            priceThreshold: Math.random() * 0.05 + 0.005, // 最大愿付价格
            urgencyFactor: Math.random() * 0.5 + 0.5, // 紧急度因子
        };
    }

    // 生成用户地址
    generateAddress() {
        return '0x' + crypto.randomBytes(20).toString('hex');
    }

    // 生成Agent偏好
    generateAgentPreference(userType) {
        const preferences = {
            casual: { reputation: 0.3, price: 0.5, availability: 0.2 },
            professional: { reputation: 0.5, price: 0.2, availability: 0.3 },
            enterprise: { reputation: 0.6, price: 0.1, availability: 0.3 }
        };
        return preferences[userType] || preferences.casual;
    }

    // 生成预算范围
    generateBudgetRange(userType) {
        const ranges = {
            casual: { min: 0.005, max: 0.02 },
            professional: { min: 0.01, max: 0.05 },
            enterprise: { min: 0.02, max: 0.1 }
        };
        return ranges[userType] || ranges.casual;
    }

    // 选择偏好订单类型
    selectPreferredOrderTypes() {
        const count = Math.floor(Math.random() * 3) + 1; // 1-3个偏好类型
        const selected = [];
        const available = [...this.config.orderTypes];
        
        for (let i = 0; i < count && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            selected.push(available.splice(index, 1)[0]);
        }
        
        return selected;
    }

    // 生成活跃度
    generateActivityLevel(userType) {
        const levels = {
            casual: 0.1 + Math.random() * 0.3,      // 10-40%
            professional: 0.4 + Math.random() * 0.3, // 40-70%
            enterprise: 0.6 + Math.random() * 0.4   // 60-100%
        };
        return levels[userType] || levels.casual;
    }

    // 调整订单频率
    adjustOrderFrequency(userType) {
        const baseFreq = this.config.orderFrequency;
        const multipliers = {
            casual: 0.3 + Math.random() * 0.4,     // 30-70%
            professional: 0.8 + Math.random() * 0.6, // 80-140%
            enterprise: 1.2 + Math.random() * 0.8   // 120-200%
        };
        return baseFreq * (multipliers[userType] || 1);
    }

    // 生成会话时长
    generateSessionDuration() {
        const min = this.config.sessionDuration.min;
        const max = this.config.sessionDuration.max;
        return min + Math.random() * (max - min);
    }

    // 分析用户群体
    analyzeUserDemographics() {
        const demographics = {
            casual: this.users.filter(u => u.type === 'casual').length,
            professional: this.users.filter(u => u.type === 'professional').length,
            enterprise: this.users.filter(u => u.type === 'enterprise').length
        };
        
        const avgOrderFreq = this.users.reduce((sum, u) => sum + u.orderFrequency, 0) / this.users.length;
        const avgBudget = this.users.reduce((sum, u) => sum + (u.budgetRange.min + u.budgetRange.max) / 2, 0) / this.users.length;
        
        console.log('✅ 用户群体初始化完成'.green);
        console.log(`   休闲用户: ${demographics.casual} (${(demographics.casual / this.users.length * 100).toFixed(1)}%)`.gray);
        console.log(`   专业用户: ${demographics.professional} (${(demographics.professional / this.users.length * 100).toFixed(1)}%)`.gray);
        console.log(`   企业用户: ${demographics.enterprise} (${(demographics.enterprise / this.users.length * 100).toFixed(1)}%)`.gray);
        console.log(`   平均订单频率: ${avgOrderFreq.toFixed(1)}单/分钟`.gray);
        console.log(`   平均预算: ${avgBudget.toFixed(4)} ETH`.gray);
    }

    // 启动用户行为模拟
    startSimulation() {
        if (this.isRunning) {
            console.log('⚠️  用户模拟已在运行'.yellow);
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 用户行为模拟启动'.green.bold);
        
        // 启动用户会话管理
        this.startUserSessionManager();
        
        // 启动订单生成器
        this.startOrderGenerator();
        
        // 启动行为统计
        this.startBehaviorAnalytics();
        
        this.emit('simulationStarted');
    }

    // 停止模拟
    stopSimulation() {
        this.isRunning = false;
        this.activeUsers.clear();
        console.log('🛑 用户行为模拟停止'.yellow);
        this.emit('simulationStopped');
    }

    // 用户会话管理
    startUserSessionManager() {
        const manageSession = () => {
            if (!this.isRunning) return;
            
            const now = Date.now();
            
            // 处理现有会话
            for (const userId of this.activeUsers) {
                const user = this.users.find(u => u.id === userId);
                if (!user) continue;
                
                // 检查会话是否应该结束
                if (now - user.sessionStartTime > user.maxSessionDuration) {
                    this.endUserSession(user);
                    continue;
                }
                
                // 检查是否应该生成新订单
                if (now > user.nextOrderTime && user.currentOrders.length < this.config.maxConcurrentOrders) {
                    this.scheduleNextOrder(user);
                }
            }
            
            // 启动新会话
            this.startNewSessions();
            
            // 更新统计
            this.behaviorStats.activesSessions = this.activeUsers.size;
            
            setTimeout(manageSession, 1000); // 每秒检查
        };
        
        manageSession();
    }

    // 启动新用户会话
    startNewSessions() {
        const targetActiveSessions = Math.floor(this.users.length * 0.1); // 10%用户在线
        const currentSessions = this.activeUsers.size;
        
        if (currentSessions < targetActiveSessions) {
            const inactiveUsers = this.users.filter(u => !this.activeUsers.has(u.id));
            const sessionsToStart = Math.min(
                targetActiveSessions - currentSessions,
                Math.floor(inactiveUsers.length * 0.01) // 每次最多启动1%的用户
            );
            
            for (let i = 0; i < sessionsToStart; i++) {
                if (inactiveUsers.length === 0) break;
                
                const user = inactiveUsers[Math.floor(Math.random() * inactiveUsers.length)];
                this.startUserSession(user);
                
                const index = inactiveUsers.indexOf(user);
                inactiveUsers.splice(index, 1);
            }
        }
    }

    // 开始用户会话
    startUserSession(user) {
        const now = Date.now();
        user.isOnline = true;
        user.sessionStartTime = now;
        user.maxSessionDuration = this.generateSessionDuration();
        user.nextOrderTime = now + Math.random() * 30000; // 0-30秒后第一个订单
        
        this.activeUsers.add(user.id);
        this.behaviorStats.totalSessions++;
        
        this.emit('userSessionStarted', { user });
    }

    // 结束用户会话
    endUserSession(user) {
        user.isOnline = false;
        user.sessionDuration = Date.now() - user.sessionStartTime;
        
        this.activeUsers.delete(user.id);
        
        this.emit('userSessionEnded', { user, duration: user.sessionDuration });
    }

    // 安排下一个订单
    scheduleNextOrder(user) {
        if (!user.isOnline || user.currentOrders.length >= this.config.maxConcurrentOrders) {
            return;
        }
        
        // 根据用户行为模式调整订单间隔
        const baseInterval = 60000 / user.orderFrequency; // 转换为毫秒
        let nextInterval = baseInterval;
        
        switch (user.behaviorPattern) {
            case 'burst':
                // 突发模式：有时很频繁，有时很少
                nextInterval = Math.random() < 0.3 ? baseInterval * 0.1 : baseInterval * 3;
                break;
            case 'steady':
                // 稳定模式：相对固定间隔
                nextInterval = baseInterval * (0.8 + Math.random() * 0.4);
                break;
            case 'random':
                // 随机模式：完全随机
                nextInterval = baseInterval * Math.random() * 2;
                break;
        }
        
        user.nextOrderTime = Date.now() + nextInterval;
    }

    // 订单生成器
    startOrderGenerator() {
        const generateOrders = () => {
            if (!this.isRunning) return;
            
            // 为活跃用户生成订单
            for (const userId of this.activeUsers) {
                const user = this.users.find(u => u.id === userId);
                if (!user || !user.isOnline) continue;
                
                const now = Date.now();
                if (now >= user.nextOrderTime && user.currentOrders.length < this.config.maxConcurrentOrders) {
                    this.createOrderForUser(user);
                    this.scheduleNextOrder(user);
                }
            }
            
            setTimeout(generateOrders, 100); // 每100ms检查
        };
        
        generateOrders();
    }

    // 为用户创建订单
    createOrderForUser(user) {
        const orderType = user.preferredOrderTypes[Math.floor(Math.random() * user.preferredOrderTypes.length)];
        const urgency = Math.random() < 0.2 ? 'high' : (Math.random() < 0.3 ? 'medium' : 'low');
        
        const order = {
            id: `order_${this.totalOrdersCreated.toString().padStart(6, '0')}`,
            userId: user.id,
            type: orderType,
            urgency: urgency,
            maxPayment: user.budgetRange.min + Math.random() * (user.budgetRange.max - user.budgetRange.min),
            qualityRequirement: user.qualityThreshold,
            createdAt: Date.now(),
            requirements: {
                specialty: orderType,
                minReputation: Math.max(50, user.qualityThreshold * 100 - 10),
                maxPrice: user.priceThreshold,
                urgencyMultiplier: urgency === 'high' ? 2 : urgency === 'medium' ? 1.5 : 1
            },
            metadata: {
                userType: user.type,
                sessionId: `${user.id}_${user.sessionStartTime}`,
                orderIndex: user.totalOrders
            }
        };
        
        user.currentOrders.push(order.id);
        user.totalOrders++;
        user.lastOrderTime = Date.now();
        this.totalOrdersCreated++;
        
        this.orderQueue.push(order);
        this.emit('orderCreated', { user, order });
        
        return order;
    }

    // 处理订单完成
    completeOrder(orderId, success, agentId) {
        const order = this.orderQueue.find(o => o.id === orderId);
        if (!order) return;
        
        const user = this.users.find(u => u.id === order.userId);
        if (!user) return;
        
        // 更新用户订单状态
        const orderIndex = user.currentOrders.indexOf(orderId);
        if (orderIndex > -1) {
            user.currentOrders.splice(orderIndex, 1);
        }
        
        if (success) {
            user.completedOrders++;
            user.totalSpent += order.maxPayment;
            this.totalOrdersCompleted++;
            
            // 更新Agent评价
            if (agentId) {
                const currentRating = user.agentRatings.get(agentId) || 70;
                const newRating = currentRating + (success ? 2 : -5);
                user.agentRatings.set(agentId, Math.max(0, Math.min(100, newRating)));
                
                // 更新偏好列表
                if (newRating > 85 && !user.favoriteAgents.includes(agentId)) {
                    user.favoriteAgents.push(agentId);
                }
                if (newRating < 40 && !user.blacklistedAgents.includes(agentId)) {
                    user.blacklistedAgents.push(agentId);
                }
            }
        } else {
            user.canceledOrders++;
        }
        
        // 从队列中移除订单
        const queueIndex = this.orderQueue.findIndex(o => o.id === orderId);
        if (queueIndex > -1) {
            this.orderQueue.splice(queueIndex, 1);
        }
        
        this.emit('orderCompleted', { user, order, success, agentId });
    }

    // 获取订单队列
    getOrderQueue() {
        return [...this.orderQueue];
    }

    // 获取待处理订单
    getPendingOrders(limit = 50) {
        return this.orderQueue
            .sort((a, b) => {
                // 按紧急度和创建时间排序
                const urgencyWeight = { high: 3, medium: 2, low: 1 };
                const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
                if (urgencyDiff !== 0) return urgencyDiff;
                return b.createdAt - a.createdAt;
            })
            .slice(0, limit);
    }

    // 行为分析
    startBehaviorAnalytics() {
        const analyzeBehavior = () => {
            if (!this.isRunning) return;
            
            // 计算每秒订单数
            const now = Date.now();
            const recentOrders = this.orderQueue.filter(o => now - o.createdAt < 1000);
            this.behaviorStats.ordersPerSecond = recentOrders.length;
            
            // 计算平均会话时长
            const completedSessions = this.users.filter(u => u.sessionDuration > 0);
            if (completedSessions.length > 0) {
                this.behaviorStats.avgSessionDuration = 
                    completedSessions.reduce((sum, u) => sum + u.sessionDuration, 0) / completedSessions.length;
            }
            
            setTimeout(analyzeBehavior, 1000);
        };
        
        analyzeBehavior();
    }

    // 获取实时统计
    getRealTimeStats() {
        const activeUsersByType = {
            casual: 0,
            professional: 0,
            enterprise: 0
        };
        
        for (const userId of this.activeUsers) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                activeUsersByType[user.type]++;
            }
        }
        
        return {
            totalUsers: this.users.length,
            activeUsers: this.activeUsers.size,
            activeUsersByType,
            totalOrders: this.totalOrdersCreated,
            completedOrders: this.totalOrdersCompleted,
            pendingOrders: this.orderQueue.length,
            ordersPerSecond: this.behaviorStats.ordersPerSecond,
            avgSessionDuration: this.behaviorStats.avgSessionDuration,
            totalSessions: this.behaviorStats.totalSessions,
            timestamp: Date.now()
        };
    }

    // 获取用户统计
    getUserStats() {
        const stats = {
            byType: { casual: 0, professional: 0, enterprise: 0 },
            byBehavior: { burst: 0, steady: 0, random: 0 },
            avgOrdersPerUser: 0,
            avgSpentPerUser: 0,
            topUsers: []
        };
        
        for (const user of this.users) {
            stats.byType[user.type]++;
            stats.byBehavior[user.behaviorPattern]++;
            stats.avgOrdersPerUser += user.totalOrders;
            stats.avgSpentPerUser += user.totalSpent;
        }
        
        stats.avgOrdersPerUser /= this.users.length;
        stats.avgSpentPerUser /= this.users.length;
        
        // 获取最活跃用户
        stats.topUsers = this.users
            .sort((a, b) => b.totalOrders - a.totalOrders)
            .slice(0, 10)
            .map(u => ({
                id: u.id,
                type: u.type,
                totalOrders: u.totalOrders,
                totalSpent: u.totalSpent,
                completedOrders: u.completedOrders
            }));
        
        return stats;
    }

    // 导出用户数据
    exportData() {
        return {
            config: this.config,
            totalUsers: this.users.length,
            stats: this.getRealTimeStats(),
            userStats: this.getUserStats(),
            behaviorStats: this.behaviorStats,
            recentOrders: this.orderQueue.slice(-100), // 最近100个订单
            users: this.users.map(user => ({
                ...user,
                agentRatings: Object.fromEntries(user.agentRatings)
            })),
            timestamp: Date.now()
        };
    }
}

module.exports = UserBehaviorSimulator;