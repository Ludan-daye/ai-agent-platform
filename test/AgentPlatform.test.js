import { expect } from "chai";
import { ethers } from "hardhat";

describe("AgentPlatform", function () {
  let agentPlatform;
  let usdtToken;
  let owner;
  let agent;
  let arbitrator;
  let buyer;

  beforeEach(async function () {
    [owner, agent, arbitrator, buyer] = await ethers.getSigners();

    // Deploy mock USDT token
    const MockUSDT = await ethers.getContractFactory("MockERC20");
    usdtToken = await MockUSDT.deploy("Mock USDT", "USDT", 6);

    // Deploy AgentPlatform
    const AgentPlatform = await ethers.getContractFactory("AgentPlatform");
    agentPlatform = await AgentPlatform.deploy(usdtToken.target);

    // Mint USDT to test accounts
    await usdtToken.mint(agent.address, ethers.parseUnits("1000", 6));
    await usdtToken.mint(arbitrator.address, ethers.parseUnits("1000", 6));
    await usdtToken.mint(buyer.address, ethers.parseUnits("1000", 6));
  });

  describe("Agent Staking", function () {
    it("Should allow agent to stake and become qualified", async function () {
      const stakeAmount = ethers.parseUnits("100", 6);
      
      await usdtToken.connect(agent).approve(agentPlatform.target, stakeAmount);
      await agentPlatform.connect(agent).stakeAsAgent(stakeAmount);
      
      expect(await agentPlatform.isQualifiedAgent(agent.address)).to.be.true;
      
      const agentData = await agentPlatform.agents(agent.address);
      expect(agentData.stakedAmount).to.equal(stakeAmount);
      expect(agentData.isQualified).to.be.true;
    });

    it("Should reject insufficient stake amounts", async function () {
      const insufficientStake = ethers.parseUnits("50", 6);
      
      await usdtToken.connect(agent).approve(agentPlatform.target, insufficientStake);
      
      await expect(
        agentPlatform.connect(agent).stakeAsAgent(insufficientStake)
      ).to.be.revertedWith("Insufficient stake amount for agent");
    });
  });

  describe("Arbitrator Staking", function () {
    it("Should allow arbitrator to stake and become qualified", async function () {
      const stakeAmount = ethers.parseUnits("500", 6);
      
      await usdtToken.connect(arbitrator).approve(agentPlatform.target, stakeAmount);
      await agentPlatform.connect(arbitrator).stakeAsArbitrator(stakeAmount);
      
      expect(await agentPlatform.isQualifiedArbitrator(arbitrator.address)).to.be.true;
      
      const arbitratorData = await agentPlatform.arbitrators(arbitrator.address);
      expect(arbitratorData.stakedAmount).to.equal(stakeAmount);
      expect(arbitratorData.isQualified).to.be.true;
    });
  });

  describe("Buyer Qualification", function () {
    it("Should allow buyer to stake for qualification", async function () {
      const stakeAmount = ethers.parseUnits("200", 6);
      
      await usdtToken.connect(buyer).approve(agentPlatform.target, stakeAmount);
      await agentPlatform.connect(buyer).stakeBuyerQualification(stakeAmount);
      
      expect(await agentPlatform.hasQualifiedBuyer(buyer.address)).to.be.true;
      
      const buyerData = await agentPlatform.buyers(buyer.address);
      expect(buyerData.stakedAmount).to.equal(stakeAmount);
      expect(buyerData.hasQualification).to.be.true;
    });
  });
});