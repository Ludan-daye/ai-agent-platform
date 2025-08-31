#!/usr/bin/env node

/**
 * 🎛️ 交互式参数配置工具
 * Interactive Configuration Tool for Performance Testing
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const colors = require('colors');

class InteractiveConfig {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.configPath = path.resolve(__dirname, 'test-params.json');
        this.config = null;
    }

    async start() {
        console.log('🎛️  智能合约性能测试 - 参数配置工具'.cyan.bold);
        console.log('====================================='.gray);
        
        await this.loadCurrentConfig();
        await this.showMainMenu();
    }

    async loadCurrentConfig() {
        try {
            this.config = await fs.readJson(this.configPath);
            console.log('✅ 当前配置已加载'.green);
        } catch (error) {
            console.log('❌ 无法加载配置文件，使用默认配置'.yellow);
            this.config = this.getDefaultConfig();
        }
    }

    async showMainMenu() {
        console.log('\\n📋 配置选项:'.blue.bold);
        console.log('1. 🤖 Agent配置');
        console.log('2. 👥 用户配置');  
        console.log('3. 🏃 模拟参数');
        console.log('4. 📊 监控设置');
        console.log('5. 👀 查看当前配置');
        console.log('6. 💾 保存配置');
        console.log('7. 🔄 重置为默认');
        console.log('8. ❌ 退出');

        const choice = await this.question('\\n请选择 (1-8): ');
        
        switch(choice) {
            case '1': await this.configureAgents(); break;
            case '2': await this.configureUsers(); break;
            case '3': await this.configureSimulation(); break;
            case '4': await this.configureMonitoring(); break;
            case '5': await this.showCurrentConfig(); break;
            case '6': await this.saveConfig(); break;
            case '7': await this.resetToDefault(); break;
            case '8': await this.exit(); return;
            default: 
                console.log('❌ 无效选择'.red);
                await this.showMainMenu();
        }
    }

    async configureAgents() {
        console.log('\\n🤖 Agent池配置'.blue.bold);
        console.log(`当前设置: ${this.config.testParameters.agents.count}个Agent`.gray);
        
        const count = await this.question('Agent数量 (10-1000): ');
        if (count && !isNaN(count) && count >= 10 && count <= 1000) {
            this.config.testParameters.agents.count = parseInt(count);
        }

        const minDeposit = await this.question(`最小抵押金 ETH (当前: ${this.config.testParameters.agents.minDeposit}): `);
        if (minDeposit && !isNaN(minDeposit)) {
            this.config.testParameters.agents.minDeposit = parseFloat(minDeposit);
        }

        const maxDeposit = await this.question(`最大抵押金 ETH (当前: ${this.config.testParameters.agents.maxDeposit}): `);
        if (maxDeposit && !isNaN(maxDeposit)) {
            this.config.testParameters.agents.maxDeposit = parseFloat(maxDeposit);
        }

        console.log('✅ Agent配置已更新'.green);
        await this.showMainMenu();
    }

    async configureUsers() {
        console.log('\\n👥 用户配置'.blue.bold);
        console.log(`当前设置: ${this.config.testParameters.users.count}个用户`.gray);

        const count = await this.question('用户数量 (100-50000): ');
        if (count && !isNaN(count) && count >= 100 && count <= 50000) {
            this.config.testParameters.users.count = parseInt(count);
        }

        const frequency = await this.question(`订单频率 (每分钟订单数, 当前: ${this.config.testParameters.users.orderFrequency}): `);
        if (frequency && !isNaN(frequency)) {
            this.config.testParameters.users.orderFrequency = parseFloat(frequency);
        }

        console.log('✅ 用户配置已更新'.green);
        await this.showMainMenu();
    }

    async configureSimulation() {
        console.log('\\n🏃 模拟参数配置'.blue.bold);

        const duration = await this.question(`模拟时长 (分钟, 当前: ${this.config.testParameters.simulation.duration}): `);
        if (duration && !isNaN(duration)) {
            this.config.testParameters.simulation.duration = parseInt(duration);
        }

        const interval = await this.question(`数据采集间隔 (秒, 当前: ${this.config.testParameters.simulation.dataInterval}): `);
        if (interval && !isNaN(interval)) {
            this.config.testParameters.simulation.dataInterval = parseInt(interval);
        }

        console.log('✅ 模拟参数已更新'.green);
        await this.showMainMenu();
    }

    async configureMonitoring() {
        console.log('\\n📊 监控设置配置'.blue.bold);

        const interval = await this.question(`监控间隔 (秒, 当前: ${this.config.testParameters.monitoring.metricsInterval}): `);
        if (interval && !isNaN(interval)) {
            this.config.testParameters.monitoring.metricsInterval = parseInt(interval);
        }

        console.log('✅ 监控设置已更新'.green);
        await this.showMainMenu();
    }

    async showCurrentConfig() {
        console.log('\\n👀 当前配置'.blue.bold);
        console.log('====================================='.gray);
        
        const agents = this.config.testParameters.agents;
        const users = this.config.testParameters.users;
        const simulation = this.config.testParameters.simulation;
        
        console.log(`🤖 Agent: ${agents.count}个, 抵押 ${agents.minDeposit}-${agents.maxDeposit} ETH`);
        console.log(`👥 用户: ${users.count}个, ${users.orderFrequency}订单/分钟`);
        console.log(`⏱️  模拟: ${simulation.duration}分钟, ${simulation.dataInterval}s采集间隔`);
        console.log(`📊 监控: ${this.config.testParameters.monitoring.metricsInterval}s间隔`);
        
        await this.question('\\n按回车继续...');
        await this.showMainMenu();
    }

    async saveConfig() {
        try {
            await fs.writeJson(this.configPath, this.config, { spaces: 2 });
            console.log('💾 配置已保存'.green.bold);
        } catch (error) {
            console.log('❌ 保存失败:'.red, error.message);
        }
        await this.showMainMenu();
    }

    async resetToDefault() {
        const confirm = await this.question('⚠️  确认重置为默认配置? (y/N): ');
        if (confirm.toLowerCase() === 'y') {
            this.config = this.getDefaultConfig();
            console.log('🔄 已重置为默认配置'.yellow);
        }
        await this.showMainMenu();
    }

    getDefaultConfig() {
        return {
            networkConfig: {
                provider: "http://127.0.0.1:8545",
                chainId: 1337,
                gasLimit: 8000000,
                gasPrice: "20000000000"
            },
            testParameters: {
                agents: {
                    count: 100,
                    minDeposit: 0.1,
                    maxDeposit: 5.0,
                    minSuccessRate: 0.6,
                    maxSuccessRate: 0.95,
                    specialtyTypes: ["ai_inference", "data_processing", "content_creation", "computation", "analysis"]
                },
                users: {
                    count: 1000,
                    orderFrequency: 2,
                    selectionStrategy: "smart",
                    behaviorPatterns: ["burst", "steady", "random"]
                },
                simulation: {
                    duration: 10,
                    dataInterval: 5,
                    rampUpTime: 2,
                    scenarios: ["normal_load", "peak_load", "stress_test"]
                },
                monitoring: {
                    metricsInterval: 1,
                    enableRealtime: true,
                    saveToFile: true,
                    reportFormats: ["json", "csv", "html"]
                }
            }
        };
    }

    question(prompt) {
        return new Promise(resolve => {
            this.rl.question(prompt, resolve);
        });
    }

    async exit() {
        console.log('👋 再见！'.cyan);
        this.rl.close();
    }
}

// 运行配置工具
if (require.main === module) {
    const config = new InteractiveConfig();
    config.start().catch(console.error);
}

module.exports = InteractiveConfig;