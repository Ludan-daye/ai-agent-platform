# 🧪 AI Agent Platform 测试检验台使用指南

> **完整的STEP 6 A/B测试与基线回归保护系统测试说明**

## 📋 目录
- [快速开始](#快速开始)
- [环境准备](#环境准备) 
- [测试脚本说明](#测试脚本说明)
- [故障排除](#故障排除)
- [详细测试场景](#详细测试场景)

## 🚀 快速开始

### 选项1: 框架功能测试 (推荐，无需区块链)
```bash
# 进入项目目录
cd my-contract

# 直接运行框架测试 (2-3分钟)
./run-lab-only-test.sh
```

### 选项2: 完整集成测试 (需要区块链)
```bash
# 1. 启动本地区块链
npx ganache --port 8545 --deterministic --wallet.totalAccounts 10 --wallet.defaultBalance 1000 &

# 2. 运行完整测试
./run-complete-test.sh
```

## 🔧 环境准备

### 必要依赖检查
```bash
# 检查Node.js版本 (需要 v16+)
node --version

# 检查npm包
npm list --depth=0

# 如果缺少依赖，运行:
npm install
```

### Ganache区块链环境

#### ✅ 正确的启动命令:
```bash
# 新版Ganache (v7+) 正确参数
npx ganache --port 8545 \
  --deterministic \
  --wallet.totalAccounts 10 \
  --wallet.defaultBalance 1000 \
  --chain.gasLimit 8000000 \
  --quiet &
```

#### ❌ 错误的命令 (会报错):
```bash
# 旧版参数，不再支持
npx ganache --accounts 10 --balance 1000  # ❌ Unknown argument: balance
```

### 端口检查
```bash
# 检查8545端口是否被占用
lsof -i :8545

# 如果被占用，杀死进程
kill -9 $(lsof -t -i:8545)
```

## 🧪 测试脚本说明

### 1. `run-lab-only-test.sh` - 框架功能测试

**测试内容:**
- ✅ Node.js环境检查
- ✅ 实验配置文件验证  
- ✅ JavaScript语法检查
- ✅ 20项覆盖验收测试 (模拟)
- ✅ 统计决策引擎逻辑
- ✅ A/B实验配置解析
- ✅ 模板文件生成
- ✅ 文档完整性检查

**预期结果:**
```
🏁 STEP 6 Lab Framework Test Complete!
=============================================
✅ Tests Passed: 10
❌ Tests Failed: 0
⏱️  Total Duration: 15s
📊 Success Rate: 100%

🎉 ALL LAB TESTS PASSED! Framework is Ready!
```

### 2. `run-complete-test.sh` - 完整集成测试

**测试内容:**
- 🔗 区块链连接测试
- 📋 合约部署验证
- 🧪 实际A/B实验执行
- 📊 真实数据统计分析
- 🏁 Go-Live检查清单
- 📈 运营流程验证

**需要先启动区块链!**

### 3. 单独模块测试

```bash
# 20项覆盖验收测试
node lab/coverage_acceptance_test.js

# 8门Go-Live检查清单  
node lab/final_go_live_checklist.js

# A/B实验执行 (试点模式)
node lab/run_ab_experiment.js --config=lab/experiment.ab001.yaml --scale=pilot

# 统计决策引擎
node lab/decision_engine.js --test_mode=true

# 上线后运营流程 
node lab/post_launch_operations.js --day=0 --test_mode=true
```

## ⚠️ 故障排除

### 问题1: "Unknown argument: balance"

**原因:** 使用了旧版Ganache参数  
**解决:**
```bash
# ❌ 错误写法
npx ganache --balance 1000

# ✅ 正确写法  
npx ganache --wallet.defaultBalance 1000
```

### 问题2: "connect ECONNREFUSED 127.0.0.1:8545"

**原因:** 区块链网络未启动  
**解决:**
```bash
# 1. 检查ganache是否在运行
ps aux | grep ganache

# 2. 杀死旧进程
pkill -f ganache

# 3. 重新启动
npx ganache --port 8545 --deterministic --wallet.totalAccounts 10 --wallet.defaultBalance 1000 &

# 4. 验证连接
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

### 问题3: "Permission denied"

**原因:** 脚本没有执行权限  
**解决:**
```bash
chmod +x *.sh
chmod +x lab/*.js
```

### 问题4: Node.js版本过低

**原因:** 需要Node.js v16+  
**解决:**
```bash
# 检查版本
node --version

# 如果版本过低，更新Node.js
# macOS: brew install node
# 或使用nvm: nvm install node
```

### 问题5: npm依赖缺失

**解决:**
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 或强制清理缓存
npm cache clean --force
npm install
```

## 📊 详细测试场景

### A. 基线回归测试 (Baseline Regression)

**目标:** 确保系统性能未退化  
**测试规模:**
- 迷你: 5×5 (2分钟)
- 标准: 50×50 (10分钟)  
- 全面: 500×500 (30分钟)

**成功标准:**
- Success rate drift ≤ ±1pp
- P95 turnaround ≤ +10%
- 资金守恒 100% OK

```bash
# 运行基线测试
node lab/baseline_regression_test.js --mode=standard
```

### B. A/B实验测试 (A/B Experiment)

**当前实验:** assignment_policy (uniform vs weighted_by_score)

**实验阶段:**
1. **Pilot** (5×5): 快速验证
2. **Small Scale** (500×500): 代表性样本
3. **Full Scale** (2000×2000): 生产级别

**统计方法:**
- Two-proportion Z-test
- Mann-Whitney U test  
- Effect size analysis
- Confidence intervals

```bash
# 试点实验
node lab/run_ab_experiment.js --scale=pilot

# 标准实验
node lab/run_ab_experiment.js --config=lab/experiment.ab001.yaml

# 查看结果
node lab/decision_engine.js --experiment_id=ab001
```

### C. 决策门检查 (Decision Gates)

**8个门控检查:**
1. **配置冻结** - SHA256 hash验证
2. **回归门** - 基线性能测试
3. **随机化公平性** - 协变量平衡
4. **干扰检查** - 订单归属隔离
5. **看门狗演练** - 降载与熔断测试
6. **数据质量门** - 100%唯一键验证
7. **决策文件** - decision.json输出
8. **文档齐活** - runbook完整性

```bash
# 全部门控检查
node lab/final_go_live_checklist.js
```

### D. 覆盖验收测试 (Coverage Acceptance)

**20项场景覆盖:**

| ID | 场景 | 验收标准 |
|----|------|----------|
| 1 | 多用户/多Agent并发 | 同高度多主体 |
| 2 | 均匀/加权分配 | 分布一致性 |
| 3 | 直付/托管全路径 | 资金守恒OK |
| 4 | 预算上限/不足处理 | budget_insufficient处理 |
| ... | ... | ... |
| 18 | 撤单覆盖 | cancel_pre≥3, cancel_post≥3 |
| 19 | 里程碑/拆单聚合 | 父任务=子任务求和/最大值 |
| 20 | 类别池匹配 | 命中率≥95%, 跨池误配=0 |

```bash
# 20项覆盖测试
node lab/coverage_acceptance_test.js
```

## 📈 性能指标与阈值

### 主要成功指标 (Primary KPIs)
- **Success Rate**: 目标 >85%, 最小改进 +2pp
- **Cost Per Success**: 目标 <0.002 native, 非退化阈值 +5%  
- **P95 Turnaround**: 目标 <10s, 可接受退化 +10%

### 护栏指标 (Guardrail Metrics)
- **Arbitration Rate**: 阈值 <8%
- **Deadline Violation Rate**: 阈值 <15%
- **System Error Rate**: 阈值 <1%
- **Agent Churn Rate**: 阈值 <5% 月度

### 业务影响指标 (Business Impact)
- **Revenue per Agent**: 经济效率
- **User Satisfaction Score**: NPS式反馈  
- **Platform Utilization**: Agent容量优化
- **Discovery Rate**: 每周新发现高性能agent数

## 🎯 测试结果解读

### ✅ 全绿 (All Green) 
**表示:** 所有测试通过，可以上线  
**后续:** 执行生产部署计划

### ⚠️ 部分黄灯 (Partial Yellow)
**表示:** 非关键测试失败，可以继续但需关注  
**后续:** 记录issues，制定改进计划

### ❌ 红灯阻断 (Red Stop)
**表示:** 关键测试失败，不能上线  
**后续:** 必须修复所有红灯问题

### 关键测试项 (Critical Tests)
以下测试失败会阻断上线:
- 并发处理 (#1)
- 支付路径 (#3)  
- 订单完成 (#7)
- 仲裁机制 (#9)
- 时延分布 (#11)
- 信誉更新 (#13)

## 🔄 持续集成建议

### Git Hooks集成
```bash
# pre-commit hook
#!/bin/bash
echo "Running STEP 6 framework tests..."
./run-lab-only-test.sh

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit blocked."
    exit 1
fi
```

### CI/CD Pipeline
```yaml
# GitHub Actions示例
name: STEP 6 Testing
on: [push, pull_request]
jobs:
  lab-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: ./run-lab-only-test.sh
```

## 📚 相关文档

- **技术规格:** `lab/runbook_step6.md`
- **优化手册:** `lab/optimization_playbook.md`
- **完整指南:** `lab/README_LAB.md`
- **持续改进:** `lab/continuous_improvement_guide.md`

## 🆘 获取帮助

### 常见问题
1. **测试太慢:** 使用 `run-lab-only-test.sh` 跳过区块链集成
2. **内存不足:** 减少并发数量或使用分批测试
3. **网络问题:** 检查防火墙和代理设置

### 联系支持
- 🐛 Bug报告: 在GitHub创建issue
- 💬 讨论交流: 加入Discord社区  
- 📧 技术支持: 发送邮件至support@example.com

---

## 🎉 开始测试!

```bash
# 推荐: 先运行框架测试
./run-lab-only-test.sh

# 成功后可尝试完整集成测试
npx ganache --port 8545 --deterministic --wallet.totalAccounts 10 --wallet.defaultBalance 1000 &
./run-complete-test.sh
```

**祝测试顺利！** 🚀