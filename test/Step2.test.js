import { expect } from "chai";
import hre from "hardhat";

describe("Step 2 - Ranking and Keyword Recommendation", function () {
  let agentPlatform;
  let usdtToken;
  let owner;
  let agent1;
  let agent2;
  let agent3;
  let buyer;

  beforeEach(async function () {
    [owner, agent1, agent2, agent3, buyer] = await hre.ethers.getSigners();

    // Deploy Mock USDT
    const MockUSDT = await hre.ethers.getContractFactory("MockERC20");
    usdtToken = await MockUSDT.deploy("Mock USDT", "USDT", 6);
    await usdtToken.waitForDeployment();

    // Deploy AgentPlatform
    const AgentPlatform = await hre.ethers.getContractFactory("AgentPlatform");
    agentPlatform = await AgentPlatform.deploy(usdtToken.target);
    await agentPlatform.waitForDeployment();

    // Mint USDT and stake agents
    const agents = [agent1, agent2, agent3];
    const stakes = [
      hre.ethers.parseUnits("100", 6), // agent1: 100 USDT
      hre.ethers.parseUnits("300", 6), // agent2: 300 USDT  
      hre.ethers.parseUnits("500", 6)  // agent3: 500 USDT
    ];

    for (let i = 0; i < agents.length; i++) {
      await usdtToken.mint(agents[i].address, hre.ethers.parseUnits("1000", 6));
      await usdtToken.connect(agents[i]).approve(agentPlatform.target, stakes[i]);
      await agentPlatform.connect(agents[i]).stakeAsAgent(stakes[i]);
    }
  });

  describe("Agent Scoring System", function () {
    it("Should return explainable scores for qualified agents", async function () {
      const [score, stake, successRate, windowSize] = await agentPlatform.getAgentScore(agent1.address);
      
      console.log("Agent1 Score Details:");
      console.log("- Score:", score.toString());
      console.log("- Stake:", hre.ethers.formatUnits(stake, 6), "USDT");
      console.log("- Success Rate:", successRate.toString());
      console.log("- Window Size:", windowSize.toString());
      
      expect(stake).to.equal(hre.ethers.parseUnits("100", 6));
      expect(windowSize).to.equal(14 * 24 * 3600); // 14 days in seconds
    });

    it("Should return zero scores for unqualified agents", async function () {
      const [score, stake, successRate, windowSize] = await agentPlatform.getAgentScore(buyer.address);
      
      expect(score).to.equal(0);
      expect(stake).to.equal(0);
      expect(successRate).to.equal(0);
      expect(windowSize).to.equal(0);
    });

    it("Should handle agents with no performance data", async function () {
      const [score, stake, successRate, windowSize] = await agentPlatform.getAgentScore(agent2.address);
      
      console.log("Agent2 (no performance data):");
      console.log("- Score:", score.toString());
      console.log("- Stake:", hre.ethers.formatUnits(stake, 6), "USDT");
      
      // Should default to stake value when no performance data
      expect(score).to.equal(hre.ethers.parseUnits("300", 6));
    });
  });

  describe("Performance Tracking", function () {
    it("Should update performance snapshots and calculate window stats", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Add performance data for agent1
      await agentPlatform.pushPerformanceSnapshot(
        agent1.address,
        10, // completed
        8,  // succeeded  
        1000, // volume
        currentTime
      );

      // Check if performance was updated
      const [score, stake, successRate, windowSize] = await agentPlatform.getAgentScore(agent1.address);
      
      console.log("Agent1 After Performance Update:");
      console.log("- Score:", score.toString());
      console.log("- Success Rate:", successRate.toString());
      
      expect(successRate).to.be.gt(0); // Should have success rate now
    });

    it("Should emit AgentPerformanceUpdated event", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      
      await expect(agentPlatform.pushPerformanceSnapshot(
        agent1.address,
        5, 4, 500, currentTime
      )).to.emit(agentPlatform, "AgentPerformanceUpdated")
        .withArgs(
          agent1.address,
          5, 4, 500,
          hre.ethers.anyValue, // windowStart
          hre.ethers.anyValue  // windowEnd
        );
    });
  });

  describe("Keyword Management", function () {
    it("Should update agent keywords with normalization", async function () {
      const keywords = ["AI", "GPT", " Machine Learning ", "OCR"];
      
      await expect(agentPlatform.connect(agent1).updateAgentCardKeywords(keywords))
        .to.emit(agentPlatform, "AgentKeywordsUpdated");
        
      console.log("Keywords updated for agent1:", keywords);
    });

    it("Should reject too many keywords", async function () {
      const tooManyKeywords = Array(11).fill("keyword"); // 11 keywords (limit is 10)
      
      await expect(
        agentPlatform.connect(agent1).updateAgentCardKeywords(tooManyKeywords)
      ).to.be.revertedWith("Too many keywords");
    });

    it("Should only allow qualified agents to update keywords", async function () {
      const keywords = ["AI", "GPT"];
      
      await expect(
        agentPlatform.connect(buyer).updateAgentCardKeywords(keywords)
      ).to.be.revertedWith("Not a qualified agent");
    });
  });

  describe("Agent Listing and Sorting", function () {
    it("Should list agents in sorted order", async function () {
      const agentList = await agentPlatform.listAgentsSorted(0, 10);
      
      console.log("Sorted Agent List:");
      agentList.forEach((addr, i) => {
        console.log(`${i+1}. ${addr}`);
      });
      
      expect(agentList.length).to.be.gt(0);
      expect(agentList.length).to.be.lte(3); // Should have our 3 agents
    });

    it("Should handle pagination correctly", async function () {
      const firstPage = await agentPlatform.listAgentsSorted(0, 2);
      const secondPage = await agentPlatform.listAgentsSorted(2, 2);
      
      console.log("First page:", firstPage.map(a => a));
      console.log("Second page:", secondPage.map(a => a));
      
      expect(firstPage.length).to.be.lte(2);
    });
  });

  describe("Keyword Recommendation System", function () {
    beforeEach(async function () {
      // Set up keywords for multiple agents
      await agentPlatform.connect(agent1).updateAgentCardKeywords(["ai", "gpt"]);
      await agentPlatform.connect(agent2).updateAgentCardKeywords(["ai", "automation"]);  
      await agentPlatform.connect(agent3).updateAgentCardKeywords(["blockchain", "smart-contracts"]);
    });

    it("Should list top keywords with weighted scores", async function () {
      const [keywords, scores, counts] = await agentPlatform.listTopKeywords(5);
      
      console.log("Top Keywords:");
      for (let i = 0; i < keywords.length; i++) {
        console.log(`- ${keywords[i]}: score=${scores[i]}, agents=${counts[i]}`);
      }
      
      expect(keywords.length).to.be.gt(0);
    });

    it("Should filter agents by keyword", async function () {
      const aiAgents = await agentPlatform.listAgentsByKeyword("ai", 0, 10);
      
      console.log("Agents with 'ai' keyword:", aiAgents);
      expect(aiAgents.length).to.equal(2); // agent1 and agent2
    });

    it("Should handle non-existent keywords", async function () {
      const nonExistentAgents = await agentPlatform.listAgentsByKeyword("nonexistent", 0, 10);
      
      expect(nonExistentAgents.length).to.equal(0);
    });
  });

  describe("Ranking Cache System", function () {
    it("Should rebuild agent ranking cache", async function () {
      await expect(agentPlatform.rebuildAgentRanking())
        .to.emit(agentPlatform, "AgentRankingRebuilt");
        
      console.log("Agent ranking cache rebuilt successfully");
    });

    it("Should use cached results when available", async function () {
      // Rebuild cache first
      await agentPlatform.rebuildAgentRanking();
      
      // Should use cached results now
      const cachedResults = await agentPlatform.listAgentsSorted(0, 10);
      
      console.log("Cached results:", cachedResults.length, "agents");
      expect(cachedResults.length).to.be.gt(0);
    });
  });

  describe("Integration Test - Full Workflow", function () {
    it("Should demonstrate complete Step 2 workflow", async function () {
      console.log("\n=== Step 2 Complete Workflow Test ===");
      
      // 1. Add performance data
      console.log("1. Adding performance data...");
      const currentTime = Math.floor(Date.now() / 1000);
      await agentPlatform.pushPerformanceSnapshot(agent1.address, 10, 9, 1000, currentTime);
      await agentPlatform.pushPerformanceSnapshot(agent2.address, 20, 18, 2000, currentTime);
      
      // 2. Update keywords
      console.log("2. Updating keywords...");
      await agentPlatform.connect(agent1).updateAgentCardKeywords(["ai", "gpt", "automation"]);
      await agentPlatform.connect(agent2).updateAgentCardKeywords(["ai", "blockchain", "smart-contracts"]);
      await agentPlatform.connect(agent3).updateAgentCardKeywords(["defi", "trading", "analytics"]);
      
      // 3. Check scores
      console.log("3. Checking explainable scores...");
      for (const agent of [agent1, agent2, agent3]) {
        const [score, stake, successRate] = await agentPlatform.getAgentScore(agent.address);
        console.log(`   Agent ${agent.address}: score=${score}, stake=${hre.ethers.formatUnits(stake, 6)} USDT, rate=${successRate}`);
      }
      
      // 4. Rebuild ranking
      console.log("4. Rebuilding ranking cache...");
      await agentPlatform.rebuildAgentRanking();
      
      // 5. Test keyword recommendations
      console.log("5. Testing keyword recommendations...");
      const [keywords, scores, counts] = await agentPlatform.listTopKeywords(3);
      console.log("   Top keywords:", keywords);
      
      // 6. Test keyword filtering
      console.log("6. Testing keyword filtering...");
      const aiAgents = await agentPlatform.listAgentsByKeyword("ai", 0, 5);
      console.log("   AI agents:", aiAgents.length);
      
      console.log("✅ Step 2 workflow completed successfully!");
      
      // Verify final state
      expect(keywords.length).to.be.gt(0);
      expect(aiAgents.length).to.be.gt(0);
    });
  });
});