/**
 * ⛽ Gas消耗追踪器
 * Gas Consumption Tracker
 * 
 * 功能：
 * - 实时Gas消耗监控
 * - 不同操作类型Gas分析
 * - Gas价格波动追踪
 * - Gas优化建议
 */

const EventEmitter = require('events');

class GasTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            trackingInterval: config.trackingInterval || 5000, // 5秒间隔
            gasPrice: config.gasPrice || 20000000000, // 20 Gwei
            enableOptimization: config.enableOptimization || true
        };
        
        this.gasData = {
            operations: new Map(), // 操作类型 -> Gas消耗记录
            timeSeriesData: [],    // 时序Gas消耗数据
            totalGasUsed: 0,
            totalTransactions: 0,
            avgGasPerTx: 0,
            gasPrice: this.config.gasPrice,
            gasPriceHistory: []
        };
        
        // 不同操作的标准Gas消耗 (估算值)
        this.standardGasCosts = {
            agentRegistration: 150000,      // Agent注册
            orderCreation: 100000,          // 订单创建
            orderAcceptance: 80000,         // 订单接受
            orderCompletion: 120000,        // 订单完成
            paymentProcessing: 90000,       // 支付处理
            reputationUpdate: 60000,        // 信誉更新
            disputeResolution: 200000,      // 争议解决
            withdrawDeposit: 70000,         // 提取押金
            systemMaintenance: 50000        // 系统维护
        };
        
        console.log('⛽ Gas追踪器初始化完成'.yellow);
    }

    // 记录Gas消耗
    recordGasUsage(operation, gasUsed, txHash = null, blockNumber = null, agentId = null) {
        const gasRecord = {
            operation,
            gasUsed: parseInt(gasUsed),
            gasPrice: this.gasPrice,
            gasCost: parseInt(gasUsed) * this.gasPrice, // Wei
            gasCostETH: (parseInt(gasUsed) * this.gasPrice) / 1e18, // ETH
            timestamp: Date.now(),
            txHash,
            blockNumber,
            agentId,
            efficiency: this.calculateEfficiency(operation, gasUsed)
        };
        
        // 按操作类型分组
        if (!this.gasData.operations.has(operation)) {
            this.gasData.operations.set(operation, []);
        }
        this.gasData.operations.get(operation).push(gasRecord);
        
        // 添加到时序数据
        this.gasData.timeSeriesData.push(gasRecord);
        
        // 更新统计
        this.updateStatistics(gasRecord);
        
        // 发出事件
        this.emit('gasUsed', gasRecord);
        
        // 检查是否需要优化建议
        if (this.config.enableOptimization) {
            this.checkOptimizationOpportunities(gasRecord);
        }
    }

    // 计算Gas效率
    calculateEfficiency(operation, gasUsed) {
        const standardGas = this.standardGasCosts[operation];
        if (!standardGas) return 1.0;
        
        // 效率 = 标准Gas / 实际Gas (1.0为标准，>1.0为优化，<1.0为浪费)
        return standardGas / parseInt(gasUsed);
    }

    // 更新统计数据
    updateStatistics(gasRecord) {
        this.gasData.totalGasUsed += gasRecord.gasUsed;
        this.gasData.totalTransactions += 1;
        this.gasData.avgGasPerTx = this.gasData.totalGasUsed / this.gasData.totalTransactions;
    }

    // 检查优化机会
    checkOptimizationOpportunities(gasRecord) {
        if (gasRecord.efficiency < 0.8) { // 效率低于80%
            this.emit('optimizationNeeded', {
                operation: gasRecord.operation,
                actualGas: gasRecord.gasUsed,
                expectedGas: this.standardGasCosts[gasRecord.operation],
                wastedGas: gasRecord.gasUsed - this.standardGasCosts[gasRecord.operation],
                recommendation: this.getOptimizationRecommendation(gasRecord.operation)
            });
        }
    }

    // 获取优化建议
    getOptimizationRecommendation(operation) {
        const recommendations = {
            agentRegistration: '考虑批量注册或简化验证流程',
            orderCreation: '优化订单数据结构，减少存储操作',
            orderAcceptance: '使用事件日志替代状态更新',
            orderCompletion: '合并多个状态更新为单次操作',
            paymentProcessing: '实现支付批处理机制',
            reputationUpdate: '延迟更新或批量处理信誉计算',
            disputeResolution: '简化争议处理逻辑',
            withdrawDeposit: '优化资金转移逻辑',
            systemMaintenance: '减少不必要的状态检查'
        };
        
        return recommendations[operation] || '分析合约代码，识别gas优化点';
    }

    // 模拟不同操作的Gas消耗
    simulateOperations(agentId, operationCounts) {
        const operations = Object.keys(operationCounts);
        
        for (const operation of operations) {
            const count = operationCounts[operation];
            
            for (let i = 0; i < count; i++) {
                // 模拟Gas消耗（标准值 ± 20%随机波动）
                const baseGas = this.standardGasCosts[operation] || 100000;
                const variation = (Math.random() - 0.5) * 0.4; // ±20%
                const actualGas = Math.floor(baseGas * (1 + variation));
                
                this.recordGasUsage(
                    operation,
                    actualGas,
                    `0x${Math.random().toString(16).substr(2, 64)}`, // 模拟txHash
                    Math.floor(Math.random() * 1000000) + 15000000,  // 模拟blockNumber
                    agentId
                );
            }
        }
    }

    // 更新Gas价格
    updateGasPrice(newGasPrice) {
        this.gasData.gasPriceHistory.push({
            price: this.gasData.gasPrice,
            timestamp: Date.now()
        });
        
        this.gasData.gasPrice = newGasPrice;
        this.gasPrice = newGasPrice;
        
        this.emit('gasPriceUpdated', {
            oldPrice: this.gasData.gasPriceHistory[this.gasData.gasPriceHistory.length - 1]?.price,
            newPrice: newGasPrice,
            change: newGasPrice - (this.gasData.gasPriceHistory[this.gasData.gasPriceHistory.length - 1]?.price || 0)
        });
    }

    // 获取指定时间范围内的Gas统计
    getGasStatsForPeriod(startTime, endTime) {
        const periodData = this.gasData.timeSeriesData.filter(
            record => record.timestamp >= startTime && record.timestamp <= endTime
        );
        
        if (periodData.length === 0) {
            return {
                totalGasUsed: 0,
                totalTransactions: 0,
                avgGasPerTx: 0,
                totalCostETH: 0,
                operations: {}
            };
        }
        
        const stats = {
            totalGasUsed: periodData.reduce((sum, record) => sum + record.gasUsed, 0),
            totalTransactions: periodData.length,
            totalCostETH: periodData.reduce((sum, record) => sum + record.gasCostETH, 0),
            operations: {}
        };
        
        stats.avgGasPerTx = stats.totalGasUsed / stats.totalTransactions;
        
        // 按操作类型分组统计
        for (const record of periodData) {
            if (!stats.operations[record.operation]) {
                stats.operations[record.operation] = {
                    count: 0,
                    totalGas: 0,
                    avgGas: 0,
                    totalCostETH: 0,
                    minGas: Infinity,
                    maxGas: 0
                };
            }
            
            const opStats = stats.operations[record.operation];
            opStats.count++;
            opStats.totalGas += record.gasUsed;
            opStats.totalCostETH += record.gasCostETH;
            opStats.minGas = Math.min(opStats.minGas, record.gasUsed);
            opStats.maxGas = Math.max(opStats.maxGas, record.gasUsed);
        }
        
        // 计算平均值
        for (const opStats of Object.values(stats.operations)) {
            opStats.avgGas = opStats.totalGas / opStats.count;
        }
        
        return stats;
    }

    // 获取Gas效率分析
    getEfficiencyAnalysis() {
        const analysis = {
            overallEfficiency: 0,
            operationEfficiency: {},
            optimizationOpportunities: [],
            totalWastedGas: 0,
            potentialSavings: 0
        };
        
        let totalRecords = 0;
        let totalEfficiency = 0;
        
        for (const [operation, records] of this.gasData.operations.entries()) {
            const opEfficiencies = records.map(r => r.efficiency);
            const avgEfficiency = opEfficiencies.reduce((sum, eff) => sum + eff, 0) / opEfficiencies.length;
            
            analysis.operationEfficiency[operation] = {
                averageEfficiency: avgEfficiency,
                recordCount: records.length,
                totalGasUsed: records.reduce((sum, r) => sum + r.gasUsed, 0),
                wastedGas: records.reduce((sum, r) => {
                    const expected = this.standardGasCosts[operation] || r.gasUsed;
                    return sum + Math.max(0, r.gasUsed - expected);
                }, 0)
            };
            
            totalRecords += records.length;
            totalEfficiency += avgEfficiency * records.length;
            analysis.totalWastedGas += analysis.operationEfficiency[operation].wastedGas;
            
            // 识别优化机会
            if (avgEfficiency < 0.9) {
                analysis.optimizationOpportunities.push({
                    operation,
                    currentEfficiency: avgEfficiency,
                    improvement: (1 - avgEfficiency) * 100,
                    recommendation: this.getOptimizationRecommendation(operation)
                });
            }
        }
        
        analysis.overallEfficiency = totalRecords > 0 ? totalEfficiency / totalRecords : 1.0;
        analysis.potentialSavings = analysis.totalWastedGas * this.gasData.gasPrice / 1e18; // ETH
        
        return analysis;
    }

    // 获取Gas价格趋势
    getGasPriceTrend() {
        if (this.gasData.gasPriceHistory.length < 2) {
            return {
                trend: 'stable',
                change: 0,
                volatility: 0
            };
        }
        
        const recent = this.gasData.gasPriceHistory.slice(-10); // 最近10个价格点
        const prices = recent.map(h => h.price);
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
        
        const firstPrice = recent[0].price;
        const lastPrice = recent[recent.length - 1].price;
        const change = (lastPrice - firstPrice) / firstPrice;
        
        return {
            trend: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
            change: change * 100, // 百分比
            volatility: Math.sqrt(variance) / avgPrice * 100, // 波动率百分比
            currentPrice: this.gasData.gasPrice,
            averagePrice: avgPrice
        };
    }

    // 预测Gas消耗
    predictGasUsage(operation, confidence = 0.95) {
        const records = this.gasData.operations.get(operation);
        if (!records || records.length === 0) {
            return {
                predicted: this.standardGasCosts[operation] || 100000,
                confidence: 0,
                range: { min: 0, max: 0 }
            };
        }
        
        const gasValues = records.map(r => r.gasUsed).sort((a, b) => a - b);
        const mean = gasValues.reduce((sum, val) => sum + val, 0) / gasValues.length;
        const variance = gasValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gasValues.length;
        const stdDev = Math.sqrt(variance);
        
        // 置信区间计算
        const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.645;
        const margin = z * stdDev / Math.sqrt(gasValues.length);
        
        return {
            predicted: Math.round(mean),
            confidence: confidence,
            range: {
                min: Math.round(mean - margin),
                max: Math.round(mean + margin)
            },
            standardDeviation: Math.round(stdDev),
            sampleSize: gasValues.length
        };
    }

    // 生成Gas优化报告
    generateOptimizationReport() {
        const efficiency = this.getEfficiencyAnalysis();
        const trend = this.getGasPriceTrend();
        
        return {
            summary: {
                totalGasUsed: this.gasData.totalGasUsed,
                totalTransactions: this.gasData.totalTransactions,
                avgGasPerTx: Math.round(this.gasData.avgGasPerTx),
                overallEfficiency: (efficiency.overallEfficiency * 100).toFixed(1) + '%',
                totalCostETH: (this.gasData.totalGasUsed * this.gasData.gasPrice / 1e18).toFixed(6),
                potentialSavingsETH: efficiency.potentialSavings.toFixed(6)
            },
            
            gasPriceTrend: trend,
            
            operationAnalysis: Object.entries(efficiency.operationEfficiency).map(([op, stats]) => ({
                operation: op,
                transactionCount: stats.recordCount,
                totalGasUsed: stats.totalGasUsed,
                averageGasPerTx: Math.round(stats.totalGasUsed / stats.recordCount),
                efficiency: (stats.averageEfficiency * 100).toFixed(1) + '%',
                wastedGas: stats.wastedGas,
                recommendation: stats.averageEfficiency < 0.9 ? this.getOptimizationRecommendation(op) : 'Good efficiency'
            })),
            
            optimizationOpportunities: efficiency.optimizationOpportunities,
            
            recommendations: [
                efficiency.overallEfficiency < 0.8 ? '整体Gas效率偏低，需要代码审查和优化' : null,
                efficiency.totalWastedGas > 1000000 ? '存在大量Gas浪费，优先优化高频操作' : null,
                trend.volatility > 20 ? 'Gas价格波动较大，考虑实现动态Gas价格调整' : null,
                this.gasData.avgGasPerTx > 200000 ? '平均Gas消耗过高，考虑合约架构优化' : null
            ].filter(r => r !== null),
            
            timestamp: Date.now()
        };
    }

    // 导出数据
    exportData() {
        return {
            config: this.config,
            gasData: {
                ...this.gasData,
                operations: Object.fromEntries(this.gasData.operations)
            },
            efficiency: this.getEfficiencyAnalysis(),
            gasPriceTrend: this.getGasPriceTrend(),
            optimizationReport: this.generateOptimizationReport(),
            timestamp: Date.now()
        };
    }

    // 清理旧数据
    cleanup(olderThanMs = 24 * 60 * 60 * 1000) { // 默认24小时
        const cutoffTime = Date.now() - olderThanMs;
        
        // 清理时序数据
        this.gasData.timeSeriesData = this.gasData.timeSeriesData.filter(
            record => record.timestamp > cutoffTime
        );
        
        // 清理操作数据
        for (const [operation, records] of this.gasData.operations.entries()) {
            const filteredRecords = records.filter(record => record.timestamp > cutoffTime);
            if (filteredRecords.length === 0) {
                this.gasData.operations.delete(operation);
            } else {
                this.gasData.operations.set(operation, filteredRecords);
            }
        }
        
        // 清理Gas价格历史
        this.gasData.gasPriceHistory = this.gasData.gasPriceHistory.filter(
            h => h.timestamp > cutoffTime
        );
    }
}

module.exports = GasTracker;