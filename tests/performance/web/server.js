#!/usr/bin/env node

/**
 * 🌐 可视化参数配置Web服务器
 * Visual Configuration Web Server
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');

class ConfigWebServer {
    constructor(port = process.env.PORT || 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.configPath = path.resolve(__dirname, '../config/test-params.json');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // 获取当前配置
        this.app.get('/api/config', async (req, res) => {
            try {
                const config = await fs.readJson(this.configPath);
                res.json(config);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // 保存配置
        this.app.post('/api/config', async (req, res) => {
            try {
                await fs.writeJson(this.configPath, req.body, { spaces: 2 });
                this.io.emit('configUpdated', req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // 验证配置
        this.app.post('/api/config/validate', (req, res) => {
            const errors = this.validateConfig(req.body);
            res.json({ valid: errors.length === 0, errors });
        });

        // 主页
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('🔗 新的Web客户端连接'.green);
            
            socket.on('getConfig', async () => {
                try {
                    const config = await fs.readJson(this.configPath);
                    socket.emit('config', config);
                } catch (error) {
                    socket.emit('error', error.message);
                }
            });

            socket.on('updateConfig', async (config) => {
                try {
                    await fs.writeJson(this.configPath, config, { spaces: 2 });
                    this.io.emit('configUpdated', config);
                } catch (error) {
                    socket.emit('error', error.message);
                }
            });

            socket.on('disconnect', () => {
                console.log('🔌 Web客户端断开连接'.yellow);
            });
        });
    }

    validateConfig(config) {
        const errors = [];
        
        if (!config.testParameters) {
            errors.push('缺少testParameters配置');
            return errors;
        }

        const { agents, users, simulation } = config.testParameters;

        // 验证Agent配置
        if (agents.count < 10 || agents.count > 1000) {
            errors.push('Agent数量必须在10-1000之间');
        }
        if (agents.minDeposit >= agents.maxDeposit) {
            errors.push('最小抵押金必须小于最大抵押金');
        }

        // 验证用户配置
        if (users.count < 100 || users.count > 50000) {
            errors.push('用户数量必须在100-50000之间');
        }
        if (users.orderFrequency <= 0) {
            errors.push('订单频率必须大于0');
        }

        // 验证模拟配置
        if (simulation.duration <= 0) {
            errors.push('模拟时长必须大于0');
        }
        if (simulation.dataInterval <= 0) {
            errors.push('数据采集间隔必须大于0');
        }

        return errors;
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log('🌐 可视化配置服务器启动成功'.green.bold);
                console.log(`📍 访问地址: http://localhost:${this.port}`.cyan);
                resolve();
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🛑 Web服务器已关闭'.yellow);
                resolve();
            });
        });
    }
}

// 启动服务器
if (require.main === module) {
    const server = new ConfigWebServer();
    server.start().catch(console.error);
    
    // 优雅关闭
    process.on('SIGINT', async () => {
        console.log('\\n🛑 收到关闭信号...'.yellow);
        await server.stop();
        process.exit(0);
    });
}

module.exports = ConfigWebServer;