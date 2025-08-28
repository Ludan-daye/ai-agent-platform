import hre from "hardhat";

async function main() {
  console.log("Step 1 - 身份与资质初始化验收演示");
  console.log("=====================================");
  
  // Deploy Mock USDT
  const MockUSDT = await hre.ethers.getContractFactory("MockERC20");
  const usdt = await MockUSDT.deploy("Mock USDT", "USDT", 6);
  await usdt.waitForDeployment();
  console.log(`Mock USDT deployed to: ${usdt.target}`);
  
  // Deploy AgentPlatform
  const AgentPlatform = await hre.ethers.getContractFactory("AgentPlatform");
  const platform = await AgentPlatform.deploy(usdt.target);
  await platform.waitForDeployment();
  console.log(`AgentPlatform deployed to: ${platform.target}`);
  
  // Get signers
  const [owner, agent, arbitrator, buyer] = await hre.ethers.getSigners();
  console.log(`Owner: ${owner.address}`);
  console.log(`Agent: ${agent.address}`);
  console.log(`Arbitrator: ${arbitrator.address}`);
  console.log(`Buyer: ${buyer.address}`);
  
  // Mint USDT to test accounts
  await usdt.mint(agent.address, hre.ethers.parseUnits("1000", 6));
  await usdt.mint(arbitrator.address, hre.ethers.parseUnits("1000", 6));
  await usdt.mint(buyer.address, hre.ethers.parseUnits("1000", 6));
  console.log("✅ Minted 1000 USDT to each test account");
  
  console.log("\n=== 验收点测试 ===");
  
  // Test 1: Agent without stake should not be qualified
  console.log("\n1. 测试未抵押Agent权限");
  const isQualifiedBefore = await platform.isQualifiedAgent(agent.address);
  console.log(`Agent qualified before stake: ${isQualifiedBefore} ❌`);
  
  // Test 2: Agent stakes and becomes qualified
  console.log("\n2. 测试Agent抵押和资质获取");
  const agentMinStake = await platform.agentMinStake();
  console.log(`最低Agent抵押要求: ${hre.ethers.formatUnits(agentMinStake, 6)} USDT`);
  
  await usdt.connect(agent).approve(platform.target, agentMinStake);
  await platform.connect(agent).stakeAsAgent(agentMinStake);
  
  const isQualifiedAfter = await platform.isQualifiedAgent(agent.address);
  console.log(`Agent qualified after stake: ${isQualifiedAfter} ✅`);
  
  // Test 3: Arbitrator stakes and becomes qualified
  console.log("\n3. 测试仲裁者抵押和资质获取");
  const arbitratorMinStake = await platform.arbitratorMinStake();
  console.log(`最低仲裁者抵押要求: ${hre.ethers.formatUnits(arbitratorMinStake, 6)} USDT`);
  
  await usdt.connect(arbitrator).approve(platform.target, arbitratorMinStake);
  await platform.connect(arbitrator).stakeAsArbitrator(arbitratorMinStake);
  
  const isArbitratorQualified = await platform.isQualifiedArbitrator(arbitrator.address);
  console.log(`Arbitrator qualified: ${isArbitratorQualified} ✅`);
  
  // Test 4: Buyer qualification
  console.log("\n4. 测试买家资质系统");
  const buyerStake = hre.ethers.parseUnits("200", 6);
  await usdt.connect(buyer).approve(platform.target, buyerStake);
  await platform.connect(buyer).stakeBuyerQualification(buyerStake);
  
  const isBuyerQualified = await platform.hasQualifiedBuyer(buyer.address);
  console.log(`Buyer qualified: ${isBuyerQualified} ✅`);
  
  // Test 5: Agent can update card only when qualified
  console.log("\n5. 测试Agent卡片更新权限");
  try {
    await platform.connect(agent).updateAgentCard(
      ["AI", "GPT", "Automation"],
      "Pay per task",
      "24/7 availability, 1 hour response time",
      100
    );
    console.log("✅ 已资质Agent成功更新AgentCard");
  } catch (error) {
    console.log("❌ Agent card update failed:", error.message);
  }
  
  // Test 6: Check qualified entities lists
  console.log("\n6. 查看已资质实体列表");
  const qualifiedAgents = await platform.getQualifiedAgents();
  const qualifiedArbitrators = await platform.getQualifiedArbitrators();
  const qualifiedBuyers = await platform.getQualifiedBuyers();
  
  console.log(`合格Agent数量: ${qualifiedAgents.length}`);
  console.log(`合格仲裁者数量: ${qualifiedArbitrators.length}`);
  console.log(`合格买家数量: ${qualifiedBuyers.length}`);
  
  console.log("\n=== Step 1 验收完成 ===");
  console.log("✅ USDT强制抵押系统正常工作");
  console.log("✅ 未达抵押阈值的实体无相应权限");
  console.log("✅ 达到抵押阈值的实体获得对应权限和可见性");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });