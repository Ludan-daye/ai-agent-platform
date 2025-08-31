/**
 * 性能监控器 - 临时版本用于测试框架
 */

class PerformanceMonitor {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        console.log('📈 性能监控器已加载 (测试版本)');
    }

    async start() {
        this.isRunning = true;
        console.log('🚀 性能监控已启动');
    }

    async stop() {
        this.isRunning = false;
        console.log('🛑 性能监控已停止');
    }

    async collectMetrics() {
        return {
            timestamp: Date.now(),
            cpu: Math.random() * 100,
            memory: Math.random() * 8000,
            requests: Math.floor(Math.random() * 1000),
            responseTime: Math.random() * 500
        };
    }
}

module.exports = PerformanceMonitor;