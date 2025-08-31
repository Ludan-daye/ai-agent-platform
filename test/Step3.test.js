import { expect } from "chai";
import hre from "hardhat";

describe("Step 3 - User Deposit & Single Agent Balance Pool", function () {
  let agentPlatform;
  let usdtToken;
  let owner;
  let agent1;
  let agent2;
  let user1;
  let user2;

  const category1 = hre.ethers.encodeBytes32String("api-calls");
  const category2 = hre.ethers.encodeBytes32String("subscription");
  const defaultCategory = hre.ethers.ZeroHash; // bytes32(0)

  beforeEach(async function () {
    [owner, agent1, agent2, user1, user2] = await hre.ethers.getSigners();

    // Deploy Mock USDT
    const MockUSDT = await hre.ethers.getContractFactory("MockERC20");
    usdtToken = await MockUSDT.deploy("Mock USDT", "USDT", 6);
    await usdtToken.waitForDeployment();

    // Deploy AgentPlatform
    const AgentPlatform = await hre.ethers.getContractFactory("AgentPlatform");
    agentPlatform = await AgentPlatform.deploy(usdtToken.target);
    await agentPlatform.waitForDeployment();

    // Setup agents with stakes
    const agentStake = hre.ethers.parseUnits("100", 6);
    for (const agent of [agent1, agent2]) {
      await usdtToken.mint(agent.address, hre.ethers.parseUnits("1000", 6));
      await usdtToken.connect(agent).approve(agentPlatform.target, agentStake);
      await agentPlatform.connect(agent).stakeAsAgent(agentStake);
    }

    // Setup users with USDT
    for (const user of [user1, user2]) {
      await usdtToken.mint(user.address, hre.ethers.parseUnits("1000", 6));
    }
  });

  describe("User Deposit & Binding", function () {
    it("Should allow user to deposit for qualified agent", async function () {
      const depositAmount = hre.ethers.parseUnits("50", 6);
      
      await usdtToken.connect(user1).approve(agentPlatform.target, depositAmount);
      
      await expect(
        agentPlatform.connect(user1).depositForAgent(agent1.address, category1, depositAmount)
      ).to.emit(agentPlatform, "BalanceAssigned")
        .withArgs(user1.address, agent1.address, category1, depositAmount);
      
      const balance = await agentPlatform.balanceOf(user1.address, agent1.address, category1);
      expect(balance).to.equal(depositAmount);
      
      console.log(`✅ User deposited ${hre.ethers.formatUnits(balance, 6)} USDT for Agent1`);
    });

    it("Should reject deposit for unqualified agent", async function () {
      const depositAmount = hre.ethers.parseUnits("50", 6);
      const unqualifiedAgent = user2.address; // user2 is not an agent
      
      await usdtToken.connect(user1).approve(agentPlatform.target, depositAmount);
      
      await expect(
        agentPlatform.connect(user1).depositForAgent(unqualifiedAgent, category1, depositAmount)
      ).to.be.revertedWith("Agent not qualified");
      
      console.log("✅ Rejected deposit for unqualified agent");
    });

    it("Should reject deposits below minimum amount", async function () {
      const smallAmount = hre.ethers.parseUnits("0.5", 6); // Below 1 USDT minimum
      
      await usdtToken.connect(user1).approve(agentPlatform.target, smallAmount);
      
      await expect(
        agentPlatform.connect(user1).depositForAgent(agent1.address, category1, smallAmount)
      ).to.be.revertedWith("Amount below minimum deposit");
      
      console.log("✅ Rejected deposit below minimum amount");
    });
  });

  describe("Balance Query Functions", function () {
    beforeEach(async function () {
      // Setup test balances
      const deposit1 = hre.ethers.parseUnits("100", 6);
      const deposit2 = hre.ethers.parseUnits("50", 6);
      
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit1);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit1);
      
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit2);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category2, deposit2);
    });

    it("Should return correct balance for user-agent-category", async function () {
      const balance1 = await agentPlatform.balanceOf(user1.address, agent1.address, category1);
      const balance2 = await agentPlatform.balanceOf(user1.address, agent1.address, category2);
      
      expect(balance1).to.equal(hre.ethers.parseUnits("100", 6));
      expect(balance2).to.equal(hre.ethers.parseUnits("50", 6));
      
      console.log(`✅ Category 1 balance: ${hre.ethers.formatUnits(balance1, 6)} USDT`);
      console.log(`✅ Category 2 balance: ${hre.ethers.formatUnits(balance2, 6)} USDT`);
    });

    it("Should return correct available balance", async function () {
      const available = await agentPlatform.availableBalance(user1.address, agent1.address, category1);
      expect(available).to.equal(hre.ethers.parseUnits("100", 6));
      
      console.log(`✅ Available balance: ${hre.ethers.formatUnits(available, 6)} USDT`);
    });

    it("Should return balance details correctly", async function () {
      const details = await agentPlatform.getBalanceDetails(user1.address, agent1.address, category1);
      
      expect(details.totalDeposited).to.equal(hre.ethers.parseUnits("100", 6));
      expect(details.totalClaimed).to.equal(0);
      expect(details.availableBalance).to.equal(hre.ethers.parseUnits("100", 6));
      expect(details.canRefund).to.be.true;
      
      console.log("✅ Balance details retrieved correctly");
    });
  });

  describe("Fund Isolation", function () {
    it("Should isolate funds between different agents", async function () {
      const deposit = hre.ethers.parseUnits("100", 6);
      
      // User deposits for agent1
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit);
      
      // Check balances
      const balanceAgent1 = await agentPlatform.balanceOf(user1.address, agent1.address, category1);
      const balanceAgent2 = await agentPlatform.balanceOf(user1.address, agent2.address, category1);
      
      expect(balanceAgent1).to.equal(deposit);
      expect(balanceAgent2).to.equal(0);
      
      console.log("✅ Funds properly isolated between agents");
    });

    it("Should isolate funds between different categories", async function () {
      const deposit = hre.ethers.parseUnits("100", 6);
      
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit);
      
      const balanceCat1 = await agentPlatform.balanceOf(user1.address, agent1.address, category1);
      const balanceCat2 = await agentPlatform.balanceOf(user1.address, agent1.address, category2);
      
      expect(balanceCat1).to.equal(deposit);
      expect(balanceCat2).to.equal(0);
      
      console.log("✅ Funds properly isolated between categories");
    });
  });

  describe("Agent Claim Function", function () {
    beforeEach(async function () {
      const deposit = hre.ethers.parseUnits("100", 6);
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit);
    });

    it("Should allow agent to claim from user balance", async function () {
      const claimAmount = hre.ethers.parseUnits("30", 6);
      const reason = hre.ethers.encodeBytes32String("api-usage");
      
      await expect(
        agentPlatform.connect(agent1).claim(user1.address, category1, claimAmount, reason)
      ).to.emit(agentPlatform, "Claimed")
        .withArgs(agent1.address, user1.address, category1, claimAmount, reason);
      
      const availableAfter = await agentPlatform.availableBalance(user1.address, agent1.address, category1);
      const agentWithdrawable = await agentPlatform.getAgentWithdrawable(agent1.address);
      
      expect(availableAfter).to.equal(hre.ethers.parseUnits("70", 6));
      expect(agentWithdrawable).to.equal(claimAmount);
      
      console.log(`✅ Agent claimed ${hre.ethers.formatUnits(claimAmount, 6)} USDT`);
      console.log(`✅ Available balance reduced to ${hre.ethers.formatUnits(availableAfter, 6)} USDT`);
    });

    it("Should reject claim exceeding available balance", async function () {
      const excessAmount = hre.ethers.parseUnits("150", 6);
      const reason = hre.ethers.encodeBytes32String("api-usage");
      
      await expect(
        agentPlatform.connect(agent1).claim(user1.address, category1, excessAmount, reason)
      ).to.be.revertedWith("Insufficient user balance");
      
      console.log("✅ Rejected claim exceeding available balance");
    });

    it("Should reject claim from unqualified agent", async function () {
      const claimAmount = hre.ethers.parseUnits("30", 6);
      const reason = hre.ethers.encodeBytes32String("api-usage");
      
      await expect(
        agentPlatform.connect(user2).claim(user1.address, category1, claimAmount, reason)
      ).to.be.revertedWith("Agent not qualified");
      
      console.log("✅ Rejected claim from unqualified agent");
    });
  });

  describe("Refund Mechanism", function () {
    beforeEach(async function () {
      const deposit = hre.ethers.parseUnits("100", 6);
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit);
    });

    it("Should allow user to refund unclaimed balance", async function () {
      const refundAmount = hre.ethers.parseUnits("40", 6);
      const userBalanceBefore = await usdtToken.balanceOf(user1.address);
      
      await expect(
        agentPlatform.connect(user1).refund(agent1.address, category1, refundAmount)
      ).to.emit(agentPlatform, "BalanceRefunded")
        .withArgs(user1.address, agent1.address, category1, refundAmount, 0);
      
      const userBalanceAfter = await usdtToken.balanceOf(user1.address);
      const availableBalance = await agentPlatform.availableBalance(user1.address, agent1.address, category1);
      
      expect(userBalanceAfter).to.equal(userBalanceBefore + refundAmount);
      expect(availableBalance).to.equal(hre.ethers.parseUnits("60", 6));
      
      console.log(`✅ Refunded ${hre.ethers.formatUnits(refundAmount, 6)} USDT to user`);
    });

    it("Should reject refund exceeding available balance", async function () {
      // First claim some amount
      const claimAmount = hre.ethers.parseUnits("70", 6);
      const reason = hre.ethers.encodeBytes32String("api-usage");
      await agentPlatform.connect(agent1).claim(user1.address, category1, claimAmount, reason);
      
      // Try to refund more than available
      const refundAmount = hre.ethers.parseUnits("50", 6);
      
      await expect(
        agentPlatform.connect(user1).refund(agent1.address, category1, refundAmount)
      ).to.be.revertedWith("Insufficient available balance");
      
      console.log("✅ Rejected refund exceeding available balance");
    });
  });

  describe("Agent Withdrawal", function () {
    it("Should allow agent to withdraw earned funds", async function () {
      // Setup: User deposits and agent claims
      const deposit = hre.ethers.parseUnits("100", 6);
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit);
      
      const claimAmount = hre.ethers.parseUnits("60", 6);
      const reason = hre.ethers.encodeBytes32String("service-provided");
      await agentPlatform.connect(agent1).claim(user1.address, category1, claimAmount, reason);
      
      // Agent withdraws
      const agentBalanceBefore = await usdtToken.balanceOf(agent1.address);
      const withdrawAmount = hre.ethers.parseUnits("40", 6);
      
      await expect(
        agentPlatform.connect(agent1).withdrawEarnings(withdrawAmount)
      ).to.emit(agentPlatform, "AgentWithdrawableUpdated")
        .withArgs(agent1.address, claimAmount - withdrawAmount);
      
      const agentBalanceAfter = await usdtToken.balanceOf(agent1.address);
      expect(agentBalanceAfter).to.equal(agentBalanceBefore + withdrawAmount);
      
      console.log(`✅ Agent withdrew ${hre.ethers.formatUnits(withdrawAmount, 6)} USDT`);
    });
  });

  describe("Integration Test - Complete Workflow", function () {
    it("Should demonstrate complete Step 3 workflow", async function () {
      console.log("\n=== Step 3 Complete Workflow Test ===");
      
      // 1. User deposits for multiple agents and categories
      console.log("1. Setting up deposits...");
      const deposit1 = hre.ethers.parseUnits("200", 6);
      const deposit2 = hre.ethers.parseUnits("100", 6);
      
      await usdtToken.connect(user1).approve(agentPlatform.target, deposit1 + deposit2);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category1, deposit1);
      await agentPlatform.connect(user1).depositForAgent(agent1.address, category2, deposit2);
      
      // 2. Check isolation
      console.log("2. Verifying fund isolation...");
      const balance1 = await agentPlatform.balanceOf(user1.address, agent1.address, category1);
      const balance2 = await agentPlatform.balanceOf(user1.address, agent1.address, category2);
      const balanceAgent2 = await agentPlatform.balanceOf(user1.address, agent2.address, category1);
      
      expect(balance1).to.equal(deposit1);
      expect(balance2).to.equal(deposit2);
      expect(balanceAgent2).to.equal(0);
      console.log(`   Agent1-Cat1: ${hre.ethers.formatUnits(balance1, 6)} USDT`);
      console.log(`   Agent1-Cat2: ${hre.ethers.formatUnits(balance2, 6)} USDT`);
      console.log(`   Agent2-Cat1: ${hre.ethers.formatUnits(balanceAgent2, 6)} USDT (isolated)`);
      
      // 3. Agent claims from different categories
      console.log("3. Testing agent claims...");
      const claim1 = hre.ethers.parseUnits("80", 6);
      const claim2 = hre.ethers.parseUnits("30", 6);
      
      await agentPlatform.connect(agent1).claim(
        user1.address, category1, claim1, hre.ethers.encodeBytes32String("api-calls")
      );
      await agentPlatform.connect(agent1).claim(
        user1.address, category2, claim2, hre.ethers.encodeBytes32String("subscription")
      );
      
      const withdrawable = await agentPlatform.getAgentWithdrawable(agent1.address);
      expect(withdrawable).to.equal(claim1 + claim2);
      console.log(`   Agent withdrawable: ${hre.ethers.formatUnits(withdrawable, 6)} USDT`);
      
      // 4. User refunds remaining balance
      console.log("4. Testing partial refund...");
      const available1 = await agentPlatform.availableBalance(user1.address, agent1.address, category1);
      const refundAmount = hre.ethers.parseUnits("50", 6);
      
      await agentPlatform.connect(user1).refund(agent1.address, category1, refundAmount);
      
      const available1After = await agentPlatform.availableBalance(user1.address, agent1.address, category1);
      expect(available1After).to.equal(available1 - refundAmount);
      console.log(`   Refunded: ${hre.ethers.formatUnits(refundAmount, 6)} USDT`);
      
      // 5. Agent withdraws earnings
      console.log("5. Testing agent withdrawal...");
      const agentBalanceBefore = await usdtToken.balanceOf(agent1.address);
      await agentPlatform.connect(agent1).withdrawEarnings(withdrawable);
      
      const agentBalanceAfter = await usdtToken.balanceOf(agent1.address);
      expect(agentBalanceAfter).to.equal(agentBalanceBefore + withdrawable);
      console.log(`   Agent final balance increased by: ${hre.ethers.formatUnits(withdrawable, 6)} USDT`);
      
      console.log("✅ Step 3 complete workflow successful!");
      
      // Final verification
      const finalWithdrawable = await agentPlatform.getAgentWithdrawable(agent1.address);
      expect(finalWithdrawable).to.equal(0);
    });
  });
});