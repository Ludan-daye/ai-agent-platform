#!/usr/bin/env node

/**
 * A/B实验执行引擎 - STEP 6核心组件
 * A/B Experiment Execution Engine with Stratified Randomization
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ABExperimentRunner {
    constructor(configPath) {
        this.configPath = configPath;
        this.results = [];
        this.assignments = [];
        
        console.log('🧪 A/B实验执行引擎启动');
        console.log(`📋 配置文件: ${configPath}`);
    }

    // 分层随机化分配
    assignArm(orderContext) {
        const { order_id, difficulty, category, agent_pool } = orderContext;
        
        // 生成分层键
        const stratumKey = `${difficulty}_${category}_${agent_pool}`;
        
        // 确定性随机化
        const seedInput = `${order_id}_${stratumKey}_${this.experimentId}_42`;
        const hash = crypto.createHash('sha256').update(seedInput).digest('hex');
        const randomValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
        
        // 50:50分配 (可配置)
        const arm = randomValue < 0.5 ? 'A' : 'B';
        
        const assignment = {
            order_id,
            arm,
            stratum: stratumKey,
            random_value: randomValue,
            timestamp: new Date().toISOString()
        };
        
        this.assignments.push(assignment);
        return assignment;
    }

    // 模拟订单执行
    simulateOrder(assignment) {
        const { arm, order_id } = assignment;
        
        // 模拟不同臂的成功率差异
        let baseSuccessRate = 0.75;
        if (arm === 'B') {
            baseSuccessRate = 0.78; // Treatment arm 3pp improvement
        }
        
        const success = Math.random() < baseSuccessRate;
        const turnaroundTime = 8000 + Math.random() * 4000; // 8-12秒
        const cost = 0.002 + Math.random() * 0.001; // 0.002-0.003 ETH
        
        return {
            order_id,
            arm,
            success,
            turnaround_ms: Math.round(turnaroundTime),
            cost_eth: parseFloat(cost.toFixed(6)),
            timestamp: new Date().toISOString()
        };
    }

    // 执行A/B实验
    async runExperiment(sampleSize = 1000) {
        console.log(`🚀 开始执行A/B实验 (样本量: ${sampleSize})`);
        
        this.experimentId = `ab_${Date.now()}`;
        
        // 生成模拟订单
        for (let i = 0; i < sampleSize; i++) {
            const orderContext = {
                order_id: `ord_${i.toString().padStart(6, '0')}`,
                difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
                category: ['compute', 'data_processing', 'ml_inference'][Math.floor(Math.random() * 3)],
                agent_pool: ['pool_A', 'pool_B'][Math.floor(Math.random() * 2)]
            };
            
            // 分配臂
            const assignment = this.assignArm(orderContext);
            
            // 执行订单
            const result = this.simulateOrder(assignment);
            this.results.push(result);
            
            // 进度显示
            if (i % 100 === 0) {
                const progress = Math.round((i / sampleSize) * 100);
                process.stdout.write(`\r📊 进度: ${progress}% (${i}/${sampleSize})`);
            }
        }
        
        console.log(`\n✅ 实验执行完成! 总样本: ${this.results.length}`);
        
        // 生成结果统计
        await this.generateResults();
        
        return this.results;
    }

    // 生成实验结果
    async generateResults() {
        const armA = this.results.filter(r => r.arm === 'A');
        const armB = this.results.filter(r => r.arm === 'B');
        
        const armA_success_rate = armA.filter(r => r.success).length / armA.length;
        const armB_success_rate = armB.filter(r => r.success).length / armB.length;
        
        const armA_avg_cost = armA.reduce((sum, r) => sum + r.cost_eth, 0) / armA.length;
        const armB_avg_cost = armB.reduce((sum, r) => sum + r.cost_eth, 0) / armB.length;
        
        const armA_p95_turnaround = this.calculateP95(armA.map(r => r.turnaround_ms));
        const armB_p95_turnaround = this.calculateP95(armB.map(r => r.turnaround_ms));
        
        const results = {
            experiment_id: this.experimentId,
            timestamp: new Date().toISOString(),
            arms: {
                A: {
                    samples: armA.length,
                    success_rate: parseFloat(armA_success_rate.toFixed(4)),
                    avg_cost: parseFloat(armA_avg_cost.toFixed(6)),
                    p95_turnaround_ms: armA_p95_turnaround
                },
                B: {
                    samples: armB.length,
                    success_rate: parseFloat(armB_success_rate.toFixed(4)),
                    avg_cost: parseFloat(armB_avg_cost.toFixed(6)),
                    p95_turnaround_ms: armB_p95_turnaround
                }
            },
            lift: {
                success_rate_pp: parseFloat(((armB_success_rate - armA_success_rate) * 100).toFixed(2)),
                cost_improvement_pct: parseFloat(((armA_avg_cost - armB_avg_cost) / armA_avg_cost * 100).toFixed(2))
            }
        };
        
        // 保存结果
        const resultsPath = path.join(__dirname, 'temp', 'experiment_results.json');
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        
        console.log('\n📊 实验结果统计:');
        console.log(`   Arm A: ${results.arms.A.success_rate * 100}% 成功率 (${results.arms.A.samples} 样本)`);
        console.log(`   Arm B: ${results.arms.B.success_rate * 100}% 成功率 (${results.arms.B.samples} 样本)`);
        console.log(`   📈 提升: ${results.lift.success_rate_pp}pp`);
        console.log(`   💰 成本改善: ${results.lift.cost_improvement_pct}%`);
        console.log(`📄 结果已保存: ${resultsPath}`);
        
        return results;
    }

    // 计算P95百分位数
    calculateP95(values) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * 0.95) - 1;
        return sorted[index];
    }
}

// CLI执行
if (require.main === module) {
    const args = process.argv.slice(2);
    const scale = args.find(arg => arg.startsWith('--scale='))?.split('=')[1] || 'standard';
    
    let sampleSize;
    switch(scale) {
        case 'pilot': sampleSize = 100; break;
        case 'small': sampleSize = 500; break;
        case 'standard': sampleSize = 1000; break;
        case 'full': sampleSize = 2000; break;
        default: sampleSize = 1000;
    }
    
    const runner = new ABExperimentRunner();
    runner.runExperiment(sampleSize).then(() => {
        console.log('🎉 A/B实验执行完成!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ 实验执行失败:', error);
        process.exit(1);
    });
}

module.exports = ABExperimentRunner;