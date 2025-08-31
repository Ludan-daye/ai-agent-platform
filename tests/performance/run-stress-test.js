#!/usr/bin/env node

/**
 * 🎯 性能压力测试主入口
 * Main Entry Point for Performance Stress Testing
 */

const PerformanceTestFramework = require('./framework');

async function main() {
    const framework = new PerformanceTestFramework();
    
    try {
        // 第一步：加载配置
        await framework.loadConfig();
        
        // 第二步：验证环境
        const envValid = await framework.validateEnvironment();
        if (!envValid) {
            process.exit(1);
        }
        
        // 第三步：初始化模块
        const modulesReady = await framework.initializeModules();
        if (!modulesReady) {
            process.exit(1);
        }
        
        // 第四步：运行测试
        const results = await framework.runTest('normal_load');
        
        console.log('🎉 测试完成！结果已保存到 reports/ 目录'.green.bold);
        process.exit(0);
        
    } catch (error) {
        console.error('💥 测试执行失败:'.red.bold, error.message);
        process.exit(1);
    }
}

// 处理中断信号
process.on('SIGINT', () => {
    console.log('\n🛑 接收到中断信号，正在停止测试...'.yellow);
    process.exit(0);
});

if (require.main === module) {
    main();
}