/**
 * 📊 间隔时间段Agent完成率追踪器
 * Interval-based Agent Completion Rate Tracker
 * 
 * 功能：
 * - 按时间间隔统计Agent完成率
 * - 实时完成率监控
 * - 不同时间段对比分析
 * - Agent个体表现追踪
 */

const EventEmitter = require('events');

class IntervalTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            intervalDuration: config.intervalDuration || 300000, // 5分钟间隔
            trackingEnabled: config.trackingEnabled !== false,
            maxHistoryIntervals: config.maxHistoryIntervals || 100 // 保留最近100个间隔
        };
        
        this.intervals = new Map(); // intervalId -> IntervalData
        this.currentInterval = null;
        this.agentPerformance = new Map(); // agentId -> PerformanceData
        this.orderTracking = new Map(); // orderId -> OrderTrackingInfo
        this.intervalCounter = 0;
        
        console.log('📊 间隔追踪器初始化完成'.yellow);
        this.startNewInterval();
    }

    // 开始新的时间间隔
    startNewInterval() {
        if (this.currentInterval) {
            this.finalizeInterval();
        }
        
        this.intervalCounter++;
        const intervalId = `interval_${this.intervalCounter}`;
        const startTime = Date.now();
        
        this.currentInterval = {
            id: intervalId,
            startTime: startTime,
            endTime: startTime + this.config.intervalDuration,
            orders: {
                created: 0,
                accepted: 0,
                completed: 0,
                failed: 0,
                pending: 0
            },
            agents: new Map(), // agentId -> AgentIntervalStats
            users: new Map(), // userId -> UserIntervalStats
            gasConsumption: {
                total: 0,
                byOperation: new Map()
            }
        };
        
        // 自动结束间隔
        setTimeout(() => {
            this.finalizeInterval();
        }, this.config.intervalDuration);
        
        console.log(`🕐 开始新间隔: ${intervalId}`.cyan);
        this.emit('intervalStarted', this.currentInterval);
    }

    // 记录订单创建
    recordOrderCreated(orderId, userId, requirements) {
        if (!this.currentInterval) return;
        
        this.currentInterval.orders.created++;
        
        // 记录用户统计
        if (!this.currentInterval.users.has(userId)) {
            this.currentInterval.users.set(userId, {
                ordersCreated: 0,
                ordersCompleted: 0,
                totalSpent: 0,
                avgWaitTime: 0
            });
        }
        this.currentInterval.users.get(userId).ordersCreated++;
        
        // 追踪订单
        this.orderTracking.set(orderId, {
            orderId,
            userId,
            requirements,
            createdTime: Date.now(),
            status: 'created',
            agentId: null,
            acceptedTime: null,
            completedTime: null,
            intervalId: this.currentInterval.id
        });
        
        this.emit('orderCreated', { orderId, userId, intervalId: this.currentInterval.id });
    }

    // 记录订单接受
    recordOrderAccepted(orderId, agentId) {
        if (!this.currentInterval) return;
        
        const orderInfo = this.orderTracking.get(orderId);
        if (!orderInfo) return;
        
        this.currentInterval.orders.accepted++;
        orderInfo.status = 'accepted';
        orderInfo.agentId = agentId;
        orderInfo.acceptedTime = Date.now();
        
        // 记录Agent统计
        if (!this.currentInterval.agents.has(agentId)) {
            this.currentInterval.agents.set(agentId, {
                ordersAccepted: 0,
                ordersCompleted: 0,
                ordersFailed: 0,
                totalRevenue: 0,
                avgCompletionTime: 0,
                completionTimes: []
            });
        }
        this.currentInterval.agents.get(agentId).ordersAccepted++;
        
        this.emit('orderAccepted', { orderId, agentId, intervalId: this.currentInterval.id });
    }

    // 记录订单完成
    recordOrderCompleted(orderId, revenue = 0) {
        if (!this.currentInterval) return;
        
        const orderInfo = this.orderTracking.get(orderId);
        if (!orderInfo) return;
        
        this.currentInterval.orders.completed++;
        this.currentInterval.orders.pending = Math.max(0, this.currentInterval.orders.pending - 1);
        
        orderInfo.status = 'completed';
        orderInfo.completedTime = Date.now();
        
        const completionTime = orderInfo.completedTime - orderInfo.createdTime;
        const agentId = orderInfo.agentId;
        const userId = orderInfo.userId;
        
        // 更新Agent统计
        if (agentId && this.currentInterval.agents.has(agentId)) {
            const agentStats = this.currentInterval.agents.get(agentId);
            agentStats.ordersCompleted++;
            agentStats.totalRevenue += revenue;
            agentStats.completionTimes.push(completionTime);
            agentStats.avgCompletionTime = agentStats.completionTimes.reduce((sum, time) => sum + time, 0) / agentStats.completionTimes.length;
        }
        
        // 更新用户统计
        if (this.currentInterval.users.has(userId)) {
            const userStats = this.currentInterval.users.get(userId);
            userStats.ordersCompleted++;
            userStats.totalSpent += revenue;
            userStats.avgWaitTime = completionTime;
        }
        
        this.emit('orderCompleted', { 
            orderId, 
            agentId, 
            userId, 
            completionTime, 
            revenue, 
            intervalId: this.currentInterval.id 
        });
    }

    // 记录订单失败
    recordOrderFailed(orderId, reason = 'unknown') {
        if (!this.currentInterval) return;
        
        const orderInfo = this.orderTracking.get(orderId);
        if (!orderInfo) return;
        
        this.currentInterval.orders.failed++;
        this.currentInterval.orders.pending = Math.max(0, this.currentInterval.orders.pending - 1);
        
        orderInfo.status = 'failed';
        orderInfo.failureReason = reason;
        
        const agentId = orderInfo.agentId;
        if (agentId && this.currentInterval.agents.has(agentId)) {
            this.currentInterval.agents.get(agentId).ordersFailed++;
        }
        
        this.emit('orderFailed', { orderId, agentId, reason, intervalId: this.currentInterval.id });
    }

    // 记录Gas消耗
    recordGasUsage(operation, gasUsed) {
        if (!this.currentInterval) return;
        
        this.currentInterval.gasConsumption.total += gasUsed;
        
        if (!this.currentInterval.gasConsumption.byOperation.has(operation)) {
            this.currentInterval.gasConsumption.byOperation.set(operation, 0);
        }
        this.currentInterval.gasConsumption.byOperation.set(operation, 
            this.currentInterval.gasConsumption.byOperation.get(operation) + gasUsed
        );
    }

    // 结束当前间隔
    finalizeInterval() {
        if (!this.currentInterval) return;
        
        const intervalData = this.currentInterval;
        intervalData.endTime = Date.now();
        intervalData.actualDuration = intervalData.endTime - intervalData.startTime;
        
        // 计算完成率
        intervalData.completionRate = intervalData.orders.accepted > 0 ? 
            (intervalData.orders.completed / intervalData.orders.accepted) : 0;
        
        // 计算Agent完成率
        intervalData.agentCompletionRates = new Map();
        for (const [agentId, stats] of intervalData.agents.entries()) {
            const completionRate = stats.ordersAccepted > 0 ? 
                (stats.ordersCompleted / stats.ordersAccepted) : 0;
            intervalData.agentCompletionRates.set(agentId, completionRate);
        }
        
        // 计算Gas效率
        intervalData.gasEfficiency = {
            avgGasPerOrder: intervalData.orders.completed > 0 ? 
                (intervalData.gasConsumption.total / intervalData.orders.completed) : 0,
            gasPerOperation: Object.fromEntries(intervalData.gasConsumption.byOperation)
        };
        
        // 保存间隔数据
        this.intervals.set(intervalData.id, intervalData);
        
        // 清理旧间隔（保留最近N个）
        if (this.intervals.size > this.config.maxHistoryIntervals) {
            const oldestInterval = Array.from(this.intervals.keys())[0];
            this.intervals.delete(oldestInterval);
        }
        
        console.log(`✅ 间隔 ${intervalData.id} 完成: 完成率 ${(intervalData.completionRate * 100).toFixed(1)}%`.green);
        this.emit('intervalFinalized', intervalData);
        
        this.currentInterval = null;
        this.startNewInterval();
    }

    // 获取当前间隔统计
    getCurrentIntervalStats() {
        if (!this.currentInterval) return null;
        
        const elapsed = Date.now() - this.currentInterval.startTime;
        const progress = elapsed / this.config.intervalDuration;
        
        return {
            ...this.currentInterval,
            elapsed: elapsed,
            progress: Math.min(progress, 1.0),
            remainingTime: Math.max(0, this.config.intervalDuration - elapsed)
        };
    }

    // 获取指定时间范围内的Agent完成率
    getAgentCompletionRates(startTime, endTime, agentIds = null) {
        const relevantIntervals = Array.from(this.intervals.values())
            .filter(interval => 
                interval.startTime >= startTime && 
                interval.endTime <= endTime
            );
        
        if (relevantIntervals.length === 0) {
            return { agents: new Map(), overall: { totalOrders: 0, completedOrders: 0, completionRate: 0 } };
        }
        
        const agentStats = new Map();
        let totalOrders = 0;
        let completedOrders = 0;
        
        // 汇总所有相关间隔的数据
        for (const interval of relevantIntervals) {
            totalOrders += interval.orders.accepted;
            completedOrders += interval.orders.completed;
            
            for (const [agentId, stats] of interval.agents.entries()) {
                if (agentIds && !agentIds.includes(agentId)) continue;
                
                if (!agentStats.has(agentId)) {
                    agentStats.set(agentId, {
                        ordersAccepted: 0,
                        ordersCompleted: 0,
                        ordersFailed: 0,
                        totalRevenue: 0,
                        completionTimes: [],
                        intervals: []
                    });
                }
                
                const agentSummary = agentStats.get(agentId);
                agentSummary.ordersAccepted += stats.ordersAccepted;
                agentSummary.ordersCompleted += stats.ordersCompleted;
                agentSummary.ordersFailed += stats.ordersFailed;
                agentSummary.totalRevenue += stats.totalRevenue;
                agentSummary.completionTimes.push(...stats.completionTimes);
                agentSummary.intervals.push(interval.id);
            }
        }
        
        // 计算每个Agent的完成率
        for (const [agentId, stats] of agentStats.entries()) {
            stats.completionRate = stats.ordersAccepted > 0 ? 
                (stats.ordersCompleted / stats.ordersAccepted) : 0;
            stats.avgCompletionTime = stats.completionTimes.length > 0 ? 
                stats.completionTimes.reduce((sum, time) => sum + time, 0) / stats.completionTimes.length : 0;
            stats.avgRevenue = stats.ordersCompleted > 0 ? 
                (stats.totalRevenue / stats.ordersCompleted) : 0;
        }
        
        return {
            agents: agentStats,
            overall: {
                totalOrders,
                completedOrders,
                completionRate: totalOrders > 0 ? (completedOrders / totalOrders) : 0,
                timeRange: { startTime, endTime },
                intervalsAnalyzed: relevantIntervals.length
            }
        };
    }

    // 获取完成率趋势分析
    getCompletionRateTrend(intervalCount = 10) {
        const recentIntervals = Array.from(this.intervals.values())
            .slice(-intervalCount)
            .sort((a, b) => a.startTime - b.startTime);
        
        if (recentIntervals.length === 0) {
            return { trend: 'no-data', intervals: [] };
        }
        
        const trendData = recentIntervals.map(interval => ({
            intervalId: interval.id,
            startTime: interval.startTime,
            completionRate: interval.completionRate,
            totalOrders: interval.orders.accepted,
            completedOrders: interval.orders.completed,
            gasEfficiency: interval.gasEfficiency.avgGasPerOrder
        }));
        
        // 计算趋势
        const rates = trendData.map(d => d.completionRate);
        const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        const firstRate = rates[0] || 0;
        const lastRate = rates[rates.length - 1] || 0;
        const trend = lastRate > firstRate ? 'improving' : lastRate < firstRate ? 'declining' : 'stable';
        
        return {
            trend,
            averageCompletionRate: avgRate,
            rateChange: lastRate - firstRate,
            intervals: trendData,
            volatility: this.calculateVolatility(rates)
        };
    }

    // 计算波动率
    calculateVolatility(values) {
        if (values.length < 2) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    // 获取间隔对比分析
    getIntervalComparison(intervalId1, intervalId2) {
        const interval1 = this.intervals.get(intervalId1);
        const interval2 = this.intervals.get(intervalId2);
        
        if (!interval1 || !interval2) {
            return null;
        }
        
        return {
            interval1: {
                id: intervalId1,
                completionRate: interval1.completionRate,
                totalOrders: interval1.orders.accepted,
                avgGasPerOrder: interval1.gasEfficiency.avgGasPerOrder,
                activeAgents: interval1.agents.size
            },
            interval2: {
                id: intervalId2,
                completionRate: interval2.completionRate,
                totalOrders: interval2.orders.accepted,
                avgGasPerOrder: interval2.gasEfficiency.avgGasPerOrder,
                activeAgents: interval2.agents.size
            },
            comparison: {
                completionRateChange: interval2.completionRate - interval1.completionRate,
                orderVolumeChange: interval2.orders.accepted - interval1.orders.accepted,
                gasEfficiencyChange: interval2.gasEfficiency.avgGasPerOrder - interval1.gasEfficiency.avgGasPerOrder,
                agentCountChange: interval2.agents.size - interval1.agents.size
            }
        };
    }

    // 导出数据
    exportData() {
        return {
            config: this.config,
            currentInterval: this.getCurrentIntervalStats(),
            intervals: Object.fromEntries(this.intervals),
            summary: {
                totalIntervals: this.intervals.size,
                avgCompletionRate: Array.from(this.intervals.values())
                    .reduce((sum, interval) => sum + interval.completionRate, 0) / this.intervals.size || 0,
                totalOrdersProcessed: Array.from(this.intervals.values())
                    .reduce((sum, interval) => sum + interval.orders.accepted, 0),
                totalGasConsumed: Array.from(this.intervals.values())
                    .reduce((sum, interval) => sum + interval.gasConsumption.total, 0)
            },
            timestamp: Date.now()
        };
    }

    // 清理数据
    cleanup(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
        const cutoffTime = Date.now() - maxAge;
        
        for (const [intervalId, interval] of this.intervals.entries()) {
            if (interval.startTime < cutoffTime) {
                this.intervals.delete(intervalId);
            }
        }
        
        // 清理订单追踪数据
        for (const [orderId, orderInfo] of this.orderTracking.entries()) {
            if (orderInfo.createdTime < cutoffTime) {
                this.orderTracking.delete(orderId);
            }
        }
    }
}

module.exports = IntervalTracker;