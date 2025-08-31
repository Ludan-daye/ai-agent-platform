# AI Agent Platform - 智能合约性能测试框架

## 🚀 项目概述

本项目是一个完整的AI Agent平台智能合约性能测试框架，专门用于模拟和测试大规模Agent生态系统的性能表现。

## ✨ 核心功能

### 📊 间隔时间段Agent完成率监控
- ✅ 实时按时间间隔统计每个Agent的完成率
- ✅ 支持自定义间隔时长（默认10秒快速模式，可配置5分钟）
- ✅ 完成率趋势分析（改善中/下降中/稳定）
- ✅ Top/Bottom Agent排行榜

### ⛽ Gas消耗详细追踪
- ✅ 实时追踪不同操作的Gas消耗（订单创建/接受/完成）
- ✅ Gas效率分析和优化建议
- ✅ 潜在Gas节省计算
- ✅ Gas价格趋势监控

### 🤖 Agent差异化模拟
- ✅ 每个Agent有不同的基础成功率（60%-95%）
- ✅ 动态性能变异（±10%-30%波动）
- ✅ 实时成功率更新和信誉评分
- ✅ 智能Agent选择算法

### 🌐 大规模模拟
- ✅ **1000个Agent** 支持
- ✅ **10000个用户** 模拟
- ✅ 多种用户类型（休闲/专业/企业）
- ✅ 智能订单匹配

## 🛠️ 快速开始

### 安装依赖
```bash
npm install
```

### 快速测试（30秒完成）
```bash
cd tests/performance
node test-fast-demo.js
```

### 启动Web可视化界面
```bash
cd tests/performance
node web/server.js
# 访问: http://localhost:3000
```

### 完整功能测试
```bash
cd tests/performance
node test-integrated-system.js
```

## 📈 测试结果

每次测试后会在 `tests/performance/reports/test_时间戳/` 目录下生成：

- **`complete_report.json`** - 完整测试数据
- **`gas_analysis.json`** - Gas消耗详细分析
- **`interval_analysis.json`** - 间隔Agent完成率分析
- **`agent_completion_rates.csv`** - Agent表现数据表格
- **`executive_summary.txt`** - 高管摘要报告

## 🎯 主要测试场景

### 1. Agent性能差异化测试
- 模拟1000个不同能力的Agent
- 成功率范围：60% - 95%
- 动态性能波动和信誉系统

### 2. 间隔时间段完成率分析
- 按时间间隔统计Agent表现
- 实时趋势分析和预测
- 识别高低表现者

### 3. Gas消耗优化分析
- 详细追踪各操作Gas消耗
- 效率分析和优化建议
- 成本节省计算

## 📊 配置说明

主要配置文件：`tests/performance/config/test-params.json`

```json
{
  "testParameters": {
    "agents": {
      "count": 1000,
      "minSuccessRate": 0.6,
      "maxSuccessRate": 0.95
    },
    "users": {
      "count": 10000
    },
    "simulation": {
      "duration": 60
    }
  }
}
```

## 🏗️ 架构组件

- **Framework** - 核心测试框架
- **Agent Pool** - Agent池模拟器
- **User Behavior** - 用户行为模拟器
- **Smart Selection** - 智能选择算法
- **Gas Tracker** - Gas消耗追踪器
- **Interval Tracker** - 间隔完成率追踪器
- **Web Interface** - 可视化配置界面

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个测试框架！

## 📝 许可证

MIT License