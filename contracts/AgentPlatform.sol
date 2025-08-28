// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentPlatform is ReentrancyGuard, Ownable {
    IERC20 public usdtToken;
    
    // Minimum staking thresholds
    uint256 public agentMinStake = 100 * 10**6; // 100 USDT (assuming 6 decimals)
    uint256 public arbitratorMinStake = 500 * 10**6; // 500 USDT
    
    // Step 2: Performance tracking constants
    uint256 public constant PERFORMANCE_WINDOW = 14 days; // 14-day sliding window
    uint256 public constant MAX_KEYWORDS_PER_AGENT = 10; // Maximum keywords per agent
    uint256 public constant RATE_PRECISION = 1e6; // For success rate calculations
    
    // Agent Card structure
    struct AgentCard {
        string[] keywords;
        string pricingModel;
        string slaTerms;
        uint256 maxCapacity;
        uint256 currentCapacity;
        bool isActive;
    }
    
    // Step 2: Performance snapshot structure
    struct PerformanceSnapshot {
        uint256 completed;
        uint256 succeeded;
        uint256 volume;
        uint256 timestamp;
    }
    
    // Step 2: Agent metadata with performance tracking
    struct AgentMeta {
        uint256 stake;
        uint256 successRate; // Rate in RATE_PRECISION (1e6)
        uint256 completedLastWindow;
        uint256 volumeLastWindow;
        uint256 lastActiveAt;
        string[] keywords;
        bool isActive;
        PerformanceSnapshot[] snapshots; // Sliding window snapshots
    }
    
    // Step 2: Keyword statistics
    struct KeywordStat {
        uint256 weightedScore;
        uint256 agentCount;
        address[] agents; // For efficient lookup
    }
    
    // Agent qualification structure (updated for Step 2)
    struct AgentQualification {
        uint256 stakedAmount;
        uint256 completedTasks;
        uint256 totalTasks;
        uint256 lastActivityTimestamp;
        bool isQualified;
        AgentCard card;
    }
    
    // Arbitrator qualification structure
    struct ArbitratorQualification {
        uint256 stakedAmount;
        uint256 votingCount;
        uint256 correctVotes;
        bool isQualified;
    }
    
    // Buyer qualification structure
    struct BuyerQualification {
        uint256 stakedAmount;
        uint256 assignedBalance;
        uint256 completedPurchases;
        uint256 totalPurchases;
        bool hasQualification;
    }
    
    // Mappings
    mapping(address => AgentQualification) public agents;
    mapping(address => ArbitratorQualification) public arbitrators;
    mapping(address => BuyerQualification) public buyers;
    
    // Step 2: New mappings for performance and keywords
    mapping(address => AgentMeta) public agentMetas;
    mapping(bytes32 => KeywordStat) public keywordStats;
    mapping(string => bytes32) public keywordHashes; // For string to hash lookup
    
    // Arrays to track qualified entities
    address[] public qualifiedAgents;
    address[] public qualifiedArbitrators;
    address[] public qualifiedBuyers;
    
    // Step 2: Ranking cache and keyword lists
    address[] public agentRankingCache;
    string[] public allKeywords;
    uint256 public lastRankingUpdate;
    
    // Step 3: Balance pool storage
    mapping(address => mapping(address => mapping(bytes32 => uint256))) public balances;
    // user → agent → category → balance
    
    mapping(address => mapping(address => mapping(bytes32 => uint256))) public claimedBalances;
    // user → agent → category → claimed amount (for refund calculation)
    
    mapping(address => uint256) public agentWithdrawable;
    // agent → withdrawable balance
    
    // Step 3: Balance operation limits
    uint256 public minDepositAmount = 1 * 10**6; // 1 USDT minimum deposit
    uint256 public refundFee = 0; // Refund fee in USDT (0 for now)
    
    // Step 4: Order management structures
    enum OrderStatus { 
        None,        // Order doesn't exist
        Proposed,    // One party has proposed
        Opened,      // Both parties signed, task active
        Delivered,   // Agent claims delivery
        Confirmed,   // Buyer confirms completion
        Disputed,    // Either party disputes
        Closed       // Final state
    }
    
    enum ProposalMode {
        BuyerInitiated,  // Buyer proposed first
        AgentInitiated   // Agent proposed first
    }
    
    struct OrderMeta {
        address buyer;
        address agent;
        bytes32 category;
        uint256 budget;
        OrderStatus status;
        ProposalMode mode;
        address proposer;      // Who initiated
        address counterparty;  // Who needs to accept
        uint256 proposedAt;    // Proposal timestamp
        uint256 openedAt;      // Acceptance timestamp
        uint256 deliveredAt;   // Delivery timestamp
        uint256 confirmedAt;   // Confirmation timestamp
        bool buyerSigned;      // Buyer signature status
        bool agentSigned;      // Agent signature status
    }
    
    // Step 4: Order storage
    mapping(bytes32 => OrderMeta) public orders;
    bytes32[] public orderIds;
    
    // Step 4: User order tracking
    mapping(address => bytes32[]) public userOrders;    // buyer orders
    mapping(address => bytes32[]) public agentOrders;   // agent orders
    
    // Step 5: Dispute and arbitration system structures
    enum DisputeOption {
        PayAgent,     // Give all remaining escrow to agent
        RefundBuyer,  // Refund all remaining escrow to buyer
        Split25,      // 75% agent, 25% buyer
        Split50,      // 50% each
        Split75       // 25% agent, 75% buyer
    }
    
    struct DisputeMeta {
        bytes32 orderId;
        address opener;            // Who opened the dispute
        string reason;             // Dispute reason
        uint256 openedAt;          // When dispute was opened
        uint256 snapshotBlock;     // Block for arbitrator stake snapshot
        uint256 escrowFrozen;      // Amount frozen in escrow
        uint256 votingDeadline;    // When voting ends
        uint256 totalVotingWeight; // Total weight of votes cast
        bool isFinalized;          // Whether dispute is resolved
        DisputeOption finalDecision; // Final arbitration result
        uint256 disputeFee;        // Fee paid by dispute opener
        mapping(address => Vote) votes;           // arbitrator => vote
        mapping(DisputeOption => uint256) optionWeights; // option => total weight
        string[] evidenceHashes;   // Evidence submitted by parties
        mapping(address => bool) hasVoted;        // track who voted
        address[] voters;          // list of all voters
    }
    
    struct Vote {
        DisputeOption option;
        uint256 weight;           // Voter's stake at snapshot
        uint256 votedAt;
        bool isValid;
    }
    
    // Step 5: Escrow management
    mapping(bytes32 => uint256) public orderEscrow;  // orderId => escrowed amount
    mapping(bytes32 => bool) public escrowFrozen;    // orderId => is frozen
    
    // Step 5: Dispute tracking
    mapping(bytes32 => DisputeMeta) public disputes; // orderId => dispute data
    mapping(bytes32 => bool) public hasActiveDispute; // orderId => has dispute
    bytes32[] public activeDisputes;
    
    // Step 5: Arbitrator stake snapshots
    mapping(address => mapping(uint256 => uint256)) public stakeSnapshots; // arbitrator => block => stake
    mapping(uint256 => address[]) public snapshotArbitrators; // block => arbitrators list
    
    // Step 5: Governance parameters
    uint256 public disputeVotingPeriod = 72 hours;    // 72 hour voting period
    uint256 public earlyFinalizationThreshold = 6667; // 66.67% in basis points (out of 10000)
    uint256 public minVotingParticipation = 3;        // Minimum 3 arbitrators must vote
    uint256 public slashingRateLimit = 1000;          // Max 10% slashing per dispute
    uint256 public disputeFeeFixed = 10 * 10**6;      // 10 USDT fixed dispute fee
    uint256 public platformFeeRate = 500;             // 5% platform fee on rewards (basis points)
    
    // Step 5: Reward pools
    uint256 public platformTreasury;                  // Platform fee accumulator
    mapping(address => uint256) public arbitratorRewards; // Pending rewards for arbitrators
    
    // Events
    event AgentStaked(address indexed agent, uint256 amount);
    event AgentCardUpdated(address indexed agent);
    event ArbitratorStaked(address indexed arbitrator, uint256 amount);
    event BuyerQualified(address indexed buyer, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);
    
    // Step 2: New events for ranking and keywords
    event AgentPerformanceUpdated(
        address indexed agent,
        uint256 completed,
        uint256 succeeded,
        uint256 volume,
        uint256 windowStart,
        uint256 windowEnd
    );
    event AgentKeywordsUpdated(address indexed agent, string[] keywords);
    event KeywordIndexRebuilt(
        bytes32 indexed keywordHash,
        string keyword,
        uint256 weightedScore,
        uint256 agentCount
    );
    event AgentRankingRebuilt(
        uint256 totalAgents,
        uint256 windowStart,
        uint256 windowEnd
    );
    
    // Step 3: Balance operation events
    event BalanceAssigned(
        address indexed user,
        address indexed agent,
        bytes32 indexed category,
        uint256 amount
    );
    event BalanceRefunded(
        address indexed user,
        address indexed agent,
        bytes32 indexed category,
        uint256 amount,
        uint256 fee
    );
    event Claimed(
        address indexed agent,
        address indexed user,
        bytes32 indexed category,
        uint256 amount,
        bytes32 reason
    );
    event AgentWithdrawableUpdated(
        address indexed agent,
        uint256 newBalance
    );
    
    // Step 4: Order management events
    event OrderProposed(
        bytes32 indexed orderId,
        address indexed proposer,
        address indexed counterparty,
        uint256 budget,
        string mode,
        bytes32 category
    );
    event OrderOpened(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed agent,
        uint256 budget,
        bytes32 category
    );
    event OrderDelivered(
        bytes32 indexed orderId,
        address indexed agent,
        uint256 timestamp
    );
    event OrderConfirmed(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 timestamp
    );
    event OrderDisputed(
        bytes32 indexed orderId,
        address indexed disputeInitiator,
        string reason
    );
    event OrderClosed(
        bytes32 indexed orderId,
        uint256 finalAmount,
        address winner
    );
    
    // Step 5: Dispute and arbitration events
    event DisputeOpened(
        bytes32 indexed orderId,
        address indexed opener,
        string reason,
        uint256 snapshotBlock,
        uint256 escrowFrozen
    );
    event EvidenceSubmitted(
        bytes32 indexed orderId,
        address indexed submitter,
        string uriHash
    );
    event DisputeVoted(
        bytes32 indexed orderId,
        address indexed arbitrator,
        DisputeOption option,
        uint256 weight
    );
    event DisputeFinalized(
        bytes32 indexed orderId,
        DisputeOption decision,
        uint256 payToAgent,
        uint256 refundToBuyer,
        uint256 rewardPool,
        uint256 slashedTotal
    );
    event OrderEscrowUpdated(
        bytes32 indexed orderId,
        uint256 before,
        uint256 after,
        string action
    );
    event ArbitratorRewarded(
        address indexed arbitrator,
        uint256 amount,
        bytes32 indexed orderId
    );
    event ArbitratorSlashed(
        address indexed arbitrator,
        uint256 amount,
        bytes32 indexed orderId
    );
    
    constructor(address _usdtToken) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
    }
    
    modifier onlyQualifiedAgent() {
        require(agents[msg.sender].isQualified, "Not a qualified agent");
        _;
    }
    
    modifier onlyQualifiedArbitrator() {
        require(arbitrators[msg.sender].isQualified, "Not a qualified arbitrator");
        _;
    }
    
    // Agent staking and qualification functions
    function stakeAsAgent(uint256 amount) external nonReentrant {
        require(amount >= agentMinStake, "Insufficient stake amount for agent");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        AgentQualification storage agent = agents[msg.sender];
        
        if (!agent.isQualified) {
            qualifiedAgents.push(msg.sender);
            agent.isQualified = true;
            agent.card.isActive = true;
        }
        
        agent.stakedAmount += amount;
        agent.lastActivityTimestamp = block.timestamp;
        
        emit AgentStaked(msg.sender, amount);
    }
    
    function updateAgentCard(
        string[] memory keywords,
        string memory pricingModel,
        string memory slaTerms,
        uint256 maxCapacity
    ) external onlyQualifiedAgent {
        AgentCard storage card = agents[msg.sender].card;
        
        card.keywords = keywords;
        card.pricingModel = pricingModel;
        card.slaTerms = slaTerms;
        card.maxCapacity = maxCapacity;
        card.isActive = true;
        
        agents[msg.sender].lastActivityTimestamp = block.timestamp;
        
        emit AgentCardUpdated(msg.sender);
    }
    
    // Arbitrator staking and qualification functions
    function stakeAsArbitrator(uint256 amount) external nonReentrant {
        require(amount >= arbitratorMinStake, "Insufficient stake amount for arbitrator");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        ArbitratorQualification storage arbitrator = arbitrators[msg.sender];
        
        if (!arbitrator.isQualified) {
            qualifiedArbitrators.push(msg.sender);
            arbitrator.isQualified = true;
        }
        
        arbitrator.stakedAmount += amount;
        
        emit ArbitratorStaked(msg.sender, amount);
    }
    
    // Buyer qualification functions
    function stakeBuyerQualification(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        BuyerQualification storage buyer = buyers[msg.sender];
        
        if (!buyer.hasQualification) {
            qualifiedBuyers.push(msg.sender);
            buyer.hasQualification = true;
        }
        
        buyer.stakedAmount += amount;
        
        emit BuyerQualified(msg.sender, amount);
    }
    
    // View functions for qualification checks
    function isQualifiedAgent(address agent) external view returns (bool) {
        return agents[agent].isQualified && agents[agent].stakedAmount >= agentMinStake;
    }
    
    function isQualifiedArbitrator(address arbitrator) external view returns (bool) {
        return arbitrators[arbitrator].isQualified && arbitrators[arbitrator].stakedAmount >= arbitratorMinStake;
    }
    
    function hasQualifiedBuyer(address buyer) external view returns (bool) {
        return buyers[buyer].hasQualification;
    }
    
    // Legacy function for backward compatibility
    function getAgentScoreSimple(address agent) external view returns (uint256) {
        AgentQualification memory agentData = agents[agent];
        if (!agentData.isQualified || agentData.totalTasks == 0) {
            return agentData.stakedAmount;
        }
        
        uint256 completionRate = (agentData.completedTasks * 100) / agentData.totalTasks;
        return agentData.stakedAmount * completionRate / 100;
    }
    
    // Get buyer score (stake/assigned balance + completion rate)
    function getBuyerScore(address buyer) external view returns (uint256) {
        BuyerQualification memory buyerData = buyers[buyer];
        if (!buyerData.hasQualification || buyerData.totalPurchases == 0) {
            return buyerData.stakedAmount + buyerData.assignedBalance;
        }
        
        uint256 completionRate = (buyerData.completedPurchases * 100) / buyerData.totalPurchases;
        uint256 baseScore = buyerData.stakedAmount + buyerData.assignedBalance;
        return baseScore * completionRate / 100;
    }
    
    // Admin functions to update minimum stakes
    function updateAgentMinStake(uint256 newMinStake) external onlyOwner {
        agentMinStake = newMinStake;
    }
    
    function updateArbitratorMinStake(uint256 newMinStake) external onlyOwner {
        arbitratorMinStake = newMinStake;
    }
    
    // Get qualified entities arrays
    function getQualifiedAgents() external view returns (address[] memory) {
        return qualifiedAgents;
    }
    
    function getQualifiedArbitrators() external view returns (address[] memory) {
        return qualifiedArbitrators;
    }
    
    function getQualifiedBuyers() external view returns (address[] memory) {
        return qualifiedBuyers;
    }
    
    // ============= STEP 2: RANKING & KEYWORD FUNCTIONS =============
    
    // A. Agent ranking with explainable scores
    function getAgentScore(address agent) 
        external 
        view 
        returns (
            uint256 score,
            uint256 stake,
            uint256 successRate,
            uint256 windowSize
        ) 
    {
        if (!agents[agent].isQualified || agents[agent].stakedAmount < agentMinStake) {
            return (0, 0, 0, 0);
        }
        
        AgentMeta memory meta = agentMetas[agent];
        stake = meta.stake > 0 ? meta.stake : agents[agent].stakedAmount;
        successRate = meta.successRate;
        windowSize = PERFORMANCE_WINDOW;
        
        // Score = stake × success_rate (normalized to RATE_PRECISION)
        score = (stake * successRate) / RATE_PRECISION;
        
        // If no performance data, use stake only
        if (successRate == 0 && meta.completedLastWindow == 0) {
            score = stake;
            successRate = RATE_PRECISION; // 100% default
        }
    }
    
    function listAgentsSorted(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory agentList) 
    {
        // Use cached ranking if available and recent
        if (agentRankingCache.length > 0 && 
            block.timestamp - lastRankingUpdate < 1 hours) {
            return _getPaginatedAgents(agentRankingCache, offset, limit);
        }
        
        // Fall back to simple qualified agents list
        return _getPaginatedAgents(qualifiedAgents, offset, limit);
    }
    
    // B. Performance tracking functions
    function pushPerformanceSnapshot(
        address agent,
        uint256 completed,
        uint256 succeeded,
        uint256 volume,
        uint256 ts
    ) external {
        require(agents[agent].isQualified, "Agent not qualified");
        require(ts <= block.timestamp, "Future timestamp not allowed");
        
        AgentMeta storage meta = agentMetas[agent];
        
        // Add new snapshot
        meta.snapshots.push(PerformanceSnapshot({
            completed: completed,
            succeeded: succeeded,
            volume: volume,
            timestamp: ts
        }));
        
        // Update performance window calculations
        _updateWindowStats(agent);
        
        emit AgentPerformanceUpdated(
            agent,
            completed,
            succeeded,
            volume,
            block.timestamp - PERFORMANCE_WINDOW,
            block.timestamp
        );
    }
    
    // C. Keyword management and recommendation
    function updateAgentCardKeywords(string[] memory keywords) external onlyQualifiedAgent {
        require(keywords.length <= MAX_KEYWORDS_PER_AGENT, "Too many keywords");
        
        AgentMeta storage meta = agentMetas[msg.sender];
        
        // Remove old keywords from index
        _removeAgentFromKeywordIndex(msg.sender);
        
        // Normalize and add new keywords
        string[] memory normalizedKeywords = new string[](keywords.length);
        for (uint256 i = 0; i < keywords.length; i++) {
            normalizedKeywords[i] = _normalizeKeyword(keywords[i]);
            require(bytes(normalizedKeywords[i]).length > 0, "Empty keyword not allowed");
        }
        
        meta.keywords = normalizedKeywords;
        
        // Add to keyword index
        _addAgentToKeywordIndex(msg.sender, normalizedKeywords);
        
        emit AgentKeywordsUpdated(msg.sender, normalizedKeywords);
    }
    
    function listTopKeywords(uint256 limit) 
        external 
        view 
        returns (
            string[] memory keywords,
            uint256[] memory weightedScores,
            uint256[] memory agentCounts
        ) 
    {
        uint256 totalKeywords = allKeywords.length;
        uint256 returnCount = limit < totalKeywords ? limit : totalKeywords;
        
        keywords = new string[](returnCount);
        weightedScores = new uint256[](returnCount);
        agentCounts = new uint256[](returnCount);
        
        // Simple implementation - return first N keywords
        // TODO: Implement proper sorting by weightedScore
        for (uint256 i = 0; i < returnCount; i++) {
            string memory keyword = allKeywords[i];
            bytes32 keywordHash = keywordHashes[keyword];
            
            keywords[i] = keyword;
            weightedScores[i] = keywordStats[keywordHash].weightedScore;
            agentCounts[i] = keywordStats[keywordHash].agentCount;
        }
    }
    
    function listAgentsByKeyword(
        string memory keyword,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        bytes32 keywordHash = keywordHashes[_normalizeKeyword(keyword)];
        address[] memory keywordAgents = keywordStats[keywordHash].agents;
        
        return _getPaginatedAgents(keywordAgents, offset, limit);
    }
    
    // D. Admin functions for cache management
    function rebuildAgentRanking() external {
        delete agentRankingCache;
        
        // Simple bubble sort for demonstration - in production use more efficient sorting
        address[] memory agents = qualifiedAgents;
        uint256 n = agents.length;
        
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                (uint256 scoreJ, , , ) = this.getAgentScore(agents[j]);
                (uint256 scoreJ1, , , ) = this.getAgentScore(agents[j + 1]);
                
                if (scoreJ < scoreJ1) {
                    address temp = agents[j];
                    agents[j] = agents[j + 1];
                    agents[j + 1] = temp;
                }
            }
        }
        
        agentRankingCache = agents;
        lastRankingUpdate = block.timestamp;
        
        emit AgentRankingRebuilt(
            agents.length,
            block.timestamp - PERFORMANCE_WINDOW,
            block.timestamp
        );
    }
    
    // ============= INTERNAL HELPER FUNCTIONS =============
    
    function _updateWindowStats(address agent) internal {
        AgentMeta storage meta = agentMetas[agent];
        uint256 windowStart = block.timestamp - PERFORMANCE_WINDOW;
        
        uint256 totalCompleted = 0;
        uint256 totalSucceeded = 0;
        uint256 totalVolume = 0;
        
        // Calculate stats within the window
        for (uint256 i = 0; i < meta.snapshots.length; i++) {
            if (meta.snapshots[i].timestamp >= windowStart) {
                totalCompleted += meta.snapshots[i].completed;
                totalSucceeded += meta.snapshots[i].succeeded;
                totalVolume += meta.snapshots[i].volume;
            }
        }
        
        meta.completedLastWindow = totalCompleted;
        meta.volumeLastWindow = totalVolume;
        meta.successRate = totalCompleted > 0 ? 
            (totalSucceeded * RATE_PRECISION) / totalCompleted : 0;
        meta.lastActiveAt = block.timestamp;
        
        // Update stake reference
        meta.stake = agents[agent].stakedAmount;
    }
    
    function _normalizeKeyword(string memory keyword) internal pure returns (string memory) {
        bytes memory keywordBytes = bytes(keyword);
        bytes memory normalized = new bytes(keywordBytes.length);
        
        uint256 writeIndex = 0;
        for (uint256 i = 0; i < keywordBytes.length; i++) {
            bytes1 char = keywordBytes[i];
            
            // Skip spaces and convert to lowercase
            if (char != 0x20) { // not space
                if (char >= 0x41 && char <= 0x5A) { // A-Z
                    normalized[writeIndex] = bytes1(uint8(char) + 32); // to lowercase
                } else {
                    normalized[writeIndex] = char;
                }
                writeIndex++;
            }
        }
        
        // Resize to actual length
        bytes memory result = new bytes(writeIndex);
        for (uint256 i = 0; i < writeIndex; i++) {
            result[i] = normalized[i];
        }
        
        return string(result);
    }
    
    function _addAgentToKeywordIndex(address agent, string[] memory keywords) internal {
        (uint256 score, , , ) = this.getAgentScore(agent);
        
        for (uint256 i = 0; i < keywords.length; i++) {
            string memory keyword = keywords[i];
            bytes32 keywordHash = keccak256(bytes(keyword));
            
            KeywordStat storage stat = keywordStats[keywordHash];
            
            // Add keyword to global list if new
            if (keywordHashes[keyword] == 0) {
                keywordHashes[keyword] = keywordHash;
                allKeywords.push(keyword);
            }
            
            // Check if agent already in this keyword's list
            bool found = false;
            for (uint256 j = 0; j < stat.agents.length; j++) {
                if (stat.agents[j] == agent) {
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                stat.agents.push(agent);
                stat.agentCount++;
            }
            
            stat.weightedScore += score;
            
            emit KeywordIndexRebuilt(keywordHash, keyword, stat.weightedScore, stat.agentCount);
        }
    }
    
    function _removeAgentFromKeywordIndex(address agent) internal {
        AgentMeta storage meta = agentMetas[agent];
        (uint256 score, , , ) = this.getAgentScore(agent);
        
        for (uint256 i = 0; i < meta.keywords.length; i++) {
            string memory keyword = meta.keywords[i];
            bytes32 keywordHash = keywordHashes[keyword];
            
            KeywordStat storage stat = keywordStats[keywordHash];
            
            // Remove agent from keyword's agent list
            for (uint256 j = 0; j < stat.agents.length; j++) {
                if (stat.agents[j] == agent) {
                    stat.agents[j] = stat.agents[stat.agents.length - 1];
                    stat.agents.pop();
                    stat.agentCount--;
                    stat.weightedScore = stat.weightedScore >= score ? 
                        stat.weightedScore - score : 0;
                    break;
                }
            }
        }
    }
    
    function _getPaginatedAgents(
        address[] memory agentList,
        uint256 offset,
        uint256 limit
    ) internal pure returns (address[] memory) {
        if (offset >= agentList.length) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > agentList.length) {
            end = agentList.length;
        }
        
        uint256 resultLength = end - offset;
        address[] memory result = new address[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = agentList[offset + i];
        }
        
        return result;
    }
    
    // ============= STEP 3: BALANCE POOL FUNCTIONS =============
    
    // A. User deposit and binding
    function depositForAgent(
        address agent,
        bytes32 category,
        uint256 amount
    ) external nonReentrant {
        require(amount >= minDepositAmount, "Amount below minimum deposit");
        require(agents[agent].isQualified, "Agent not qualified");
        require(agents[agent].stakedAmount >= agentMinStake, "Agent stake insufficient");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Add to user's balance pool for this agent and category
        balances[msg.sender][agent][category] += amount;
        
        emit BalanceAssigned(msg.sender, agent, category, amount);
    }
    
    // B. Balance query functions
    function balanceOf(
        address user,
        address agent,
        bytes32 category
    ) external view returns (uint256) {
        return balances[user][agent][category];
    }
    
    function availableBalance(
        address user,
        address agent,
        bytes32 category
    ) external view returns (uint256) {
        uint256 totalBalance = balances[user][agent][category];
        uint256 claimed = claimedBalances[user][agent][category];
        return totalBalance >= claimed ? totalBalance - claimed : 0;
    }
    
    function totalAssignedToAgent(
        address user,
        address agent
    ) external view returns (uint256 total) {
        // Note: This is a simplified implementation
        // In practice, you might want to iterate through categories
        // or maintain a separate mapping for efficiency
        return balances[user][agent][bytes32(0)]; // Default category for now
    }
    
    function getAgentWithdrawable(address agent) external view returns (uint256) {
        return agentWithdrawable[agent];
    }
    
    // C. Refund mechanism
    function refund(
        address agent,
        bytes32 category,
        uint256 amount
    ) external nonReentrant {
        uint256 available = this.availableBalance(msg.sender, agent, category);
        require(available >= amount, "Insufficient available balance");
        require(amount > refundFee, "Amount must cover refund fee");
        
        uint256 netRefund = amount - refundFee;
        
        // Reduce balance
        balances[msg.sender][agent][category] -= amount;
        
        // Transfer back to user
        require(usdtToken.transfer(msg.sender, netRefund), "Refund transfer failed");
        
        // Handle refund fee if any
        if (refundFee > 0) {
            agentWithdrawable[agent] += refundFee;
            emit AgentWithdrawableUpdated(agent, agentWithdrawable[agent]);
        }
        
        emit BalanceRefunded(msg.sender, agent, category, netRefund, refundFee);
    }
    
    // D. Agent claim function (for Step 5 integration)
    function claim(
        address user,
        bytes32 category,
        uint256 amount,
        bytes32 reason
    ) external nonReentrant {
        require(agents[msg.sender].isQualified, "Agent not qualified");
        
        uint256 available = this.availableBalance(user, msg.sender, category);
        require(available >= amount, "Insufficient user balance");
        
        // Update claimed amount
        claimedBalances[user][msg.sender][category] += amount;
        
        // Add to agent's withdrawable balance
        agentWithdrawable[msg.sender] += amount;
        
        emit Claimed(msg.sender, user, category, amount, reason);
        emit AgentWithdrawableUpdated(msg.sender, agentWithdrawable[msg.sender]);
    }
    
    // D. Order-specific claim (for escrow integration)
    function claimFromOrder(bytes32 orderId, uint256 amount) external nonReentrant {
        OrderMeta storage order = orders[orderId];
        require(order.agent == msg.sender, "Not the order agent");
        require(order.status == OrderStatus.Opened, "Order not in opened state");
        require(agents[msg.sender].isQualified, "Agent not qualified");
        require(!escrowFrozen[orderId], "Order escrow is frozen due to dispute");
        
        uint256 availableEscrow = orderEscrow[orderId];
        require(availableEscrow >= amount, "Insufficient escrow balance");
        
        // Deduct from escrow and add to agent's withdrawable balance
        orderEscrow[orderId] -= amount;
        agentWithdrawable[msg.sender] += amount;
        
        emit OrderEscrowUpdated(orderId, availableEscrow, orderEscrow[orderId], "agent-claim");
        emit Claimed(msg.sender, order.buyer, order.category, amount, keccak256("escrow-claim"));
        emit AgentWithdrawableUpdated(msg.sender, agentWithdrawable[msg.sender]);
    }
    
    // E. Agent withdrawal function
    function withdrawEarnings(uint256 amount) external nonReentrant {
        require(agents[msg.sender].isQualified, "Agent not qualified");
        require(agentWithdrawable[msg.sender] >= amount, "Insufficient withdrawable balance");
        
        agentWithdrawable[msg.sender] -= amount;
        require(usdtToken.transfer(msg.sender, amount), "Withdrawal failed");
        
        emit AgentWithdrawableUpdated(msg.sender, agentWithdrawable[msg.sender]);
    }
    
    // F. Admin functions for Step 3 parameters
    function updateMinDepositAmount(uint256 newAmount) external onlyOwner {
        minDepositAmount = newAmount;
    }
    
    function updateRefundFee(uint256 newFee) external onlyOwner {
        refundFee = newFee;
    }
    
    // G. View functions for balance analytics
    function getUserAgentCategories(
        address user,
        address agent
    ) external view returns (bytes32[] memory) {
        // Simplified implementation - return default category
        bytes32[] memory categories = new bytes32[](1);
        categories[0] = bytes32(0);
        return categories;
    }
    
    function getBalanceDetails(
        address user,
        address agent,
        bytes32 category
    ) external view returns (
        uint256 totalDeposited,
        uint256 totalClaimed,
        uint256 availableBalance,
        bool canRefund
    ) {
        totalDeposited = balances[user][agent][category];
        totalClaimed = claimedBalances[user][agent][category];
        availableBalance = totalDeposited >= totalClaimed ? totalDeposited - totalClaimed : 0;
        canRefund = availableBalance > refundFee;
    }
    
    // H. Emergency functions (for security)
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause functionality
        // This would require additional state variables and modifiers
    }
    
    // I. Batch operations for efficiency
    function batchDeposit(
        address[] memory agents,
        bytes32[] memory categories,
        uint256[] memory amounts
    ) external nonReentrant {
        require(agents.length == categories.length && categories.length == amounts.length, "Array length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
            require(amounts[i] >= minDepositAmount, "Amount below minimum");
            require(agents[agents[i]].isQualified, "Agent not qualified");
        }
        
        require(usdtToken.transferFrom(msg.sender, address(this), totalAmount), "Batch transfer failed");
        
        for (uint256 i = 0; i < agents.length; i++) {
            balances[msg.sender][agents[i]][categories[i]] += amounts[i];
            emit BalanceAssigned(msg.sender, agents[i], categories[i], amounts[i]);
        }
    }
    
    // ============= STEP 4: DUAL SIGNATURE ORDER FUNCTIONS =============
    
    // A. Buyer-initiated proposal
    function buyerPropose(
        address agent,
        bytes32 orderId,
        bytes32 category,
        uint256 budget
    ) external nonReentrant {
        require(orders[orderId].status == OrderStatus.None, "Order already exists");
        require(agents[agent].isQualified, "Agent not qualified");
        require(buyers[msg.sender].hasQualification, "Buyer not qualified");
        require(budget > 0, "Budget must be greater than 0");
        
        // Check buyer has sufficient balance for this agent and category
        uint256 available = this.availableBalance(msg.sender, agent, category);
        require(available >= budget, "Insufficient buyer balance");
        
        // Check agent capacity (based on their staking limits)
        uint256 agentStake = agents[agent].stakedAmount;
        require(budget <= agentStake, "Budget exceeds agent stake capacity");
        
        // Create order
        OrderMeta storage order = orders[orderId];
        order.buyer = msg.sender;
        order.agent = agent;
        order.category = category;
        order.budget = budget;
        order.status = OrderStatus.Proposed;
        order.mode = ProposalMode.BuyerInitiated;
        order.proposer = msg.sender;
        order.counterparty = agent;
        order.proposedAt = block.timestamp;
        order.buyerSigned = true;  // Buyer signs by proposing
        order.agentSigned = false;
        
        // Track orders
        orderIds.push(orderId);
        userOrders[msg.sender].push(orderId);
        agentOrders[agent].push(orderId);
        
        emit OrderProposed(orderId, msg.sender, agent, budget, "buyer-initiated", category);
    }
    
    // B. Agent accepts buyer proposal
    function agentAccept(bytes32 orderId) external nonReentrant {
        OrderMeta storage order = orders[orderId];
        require(order.status == OrderStatus.Proposed, "Order not in proposed state");
        require(order.mode == ProposalMode.BuyerInitiated, "Not a buyer-initiated proposal");
        require(order.agent == msg.sender, "Not the designated agent");
        require(!order.agentSigned, "Agent already signed");
        require(agents[msg.sender].isQualified, "Agent not qualified");
        
        // Final balance check (in case balance changed since proposal)
        uint256 available = this.availableBalance(order.buyer, order.agent, order.category);
        require(available >= order.budget, "Buyer balance insufficient for order");
        
        // Agent signs and opens order
        order.agentSigned = true;
        order.status = OrderStatus.Opened;
        order.openedAt = block.timestamp;
        
        // Lock budget in escrow
        _lockOrderEscrow(orderId, order.budget);
        
        emit OrderOpened(orderId, order.buyer, order.agent, order.budget, order.category);
    }
    
    // C. Agent-initiated proposal
    function agentPropose(
        address buyer,
        bytes32 orderId,
        bytes32 category,
        uint256 budget
    ) external nonReentrant {
        require(orders[orderId].status == OrderStatus.None, "Order already exists");
        require(agents[msg.sender].isQualified, "Agent not qualified");
        require(buyers[buyer].hasQualification, "Buyer not qualified");
        require(budget > 0, "Budget must be greater than 0");
        
        // Check agent capacity (their own staking limits)
        uint256 agentStake = agents[msg.sender].stakedAmount;
        require(budget <= agentStake, "Budget exceeds agent stake capacity");
        
        // Create order
        OrderMeta storage order = orders[orderId];
        order.buyer = buyer;
        order.agent = msg.sender;
        order.category = category;
        order.budget = budget;
        order.status = OrderStatus.Proposed;
        order.mode = ProposalMode.AgentInitiated;
        order.proposer = msg.sender;
        order.counterparty = buyer;
        order.proposedAt = block.timestamp;
        order.buyerSigned = false;
        order.agentSigned = true;  // Agent signs by proposing
        
        // Track orders
        orderIds.push(orderId);
        userOrders[buyer].push(orderId);
        agentOrders[msg.sender].push(orderId);
        
        emit OrderProposed(orderId, msg.sender, buyer, budget, "agent-initiated", category);
    }
    
    // D. Buyer accepts agent proposal
    function buyerAccept(bytes32 orderId) external nonReentrant {
        OrderMeta storage order = orders[orderId];
        require(order.status == OrderStatus.Proposed, "Order not in proposed state");
        require(order.mode == ProposalMode.AgentInitiated, "Not an agent-initiated proposal");
        require(order.buyer == msg.sender, "Not the designated buyer");
        require(!order.buyerSigned, "Buyer already signed");
        require(buyers[msg.sender].hasQualification, "Buyer not qualified");
        
        // Check buyer has sufficient balance
        uint256 available = this.availableBalance(msg.sender, order.agent, order.category);
        require(available >= order.budget, "Insufficient buyer balance");
        
        // Buyer signs and opens order
        order.buyerSigned = true;
        order.status = OrderStatus.Opened;
        order.openedAt = block.timestamp;
        
        // Lock budget in escrow
        _lockOrderEscrow(orderId, order.budget);
        
        emit OrderOpened(orderId, order.buyer, order.agent, order.budget, order.category);
    }
    
    // E. Order delivery (for Step 5 integration)
    function deliverOrder(bytes32 orderId) external nonReentrant {
        OrderMeta storage order = orders[orderId];
        require(order.status == OrderStatus.Opened, "Order not opened");
        require(order.agent == msg.sender, "Not the order agent");
        require(agents[msg.sender].isQualified, "Agent not qualified");
        
        order.status = OrderStatus.Delivered;
        order.deliveredAt = block.timestamp;
        
        emit OrderDelivered(orderId, msg.sender, block.timestamp);
    }
    
    // F. Order confirmation (for Step 5 integration)
    function confirmOrder(bytes32 orderId) external nonReentrant {
        OrderMeta storage order = orders[orderId];
        require(order.status == OrderStatus.Delivered, "Order not delivered");
        require(order.buyer == msg.sender, "Not the order buyer");
        require(buyers[msg.sender].hasQualification, "Buyer not qualified");
        
        order.status = OrderStatus.Confirmed;
        order.confirmedAt = block.timestamp;
        
        // Automatically release remaining escrow to agent
        uint256 remainingEscrow = orderEscrow[orderId];
        if (remainingEscrow > 0) {
            orderEscrow[orderId] = 0;
            agentWithdrawable[order.agent] += remainingEscrow;
            emit OrderEscrowUpdated(orderId, remainingEscrow, 0, "order-confirmed");
            emit AgentWithdrawableUpdated(order.agent, agentWithdrawable[order.agent]);
        }
        
        emit OrderConfirmed(orderId, msg.sender, block.timestamp);
    }
    
    // ============= STEP 5: DISPUTE & ARBITRATION FUNCTIONS =============
    
    // A. Internal escrow management functions
    function _lockOrderEscrow(bytes32 orderId, uint256 amount) internal {
        OrderMeta storage order = orders[orderId];
        
        // Transfer from user's available balance to escrow
        uint256 available = this.availableBalance(order.buyer, order.agent, order.category);
        require(available >= amount, "Insufficient balance to lock in escrow");
        
        // Update claimed balance to reserve the funds
        claimedBalances[order.buyer][order.agent][order.category] += amount;
        
        // Set escrow amount
        orderEscrow[orderId] = amount;
        escrowFrozen[orderId] = false;
        
        emit OrderEscrowUpdated(orderId, 0, amount, "escrow-locked");
    }
    
    // B. Create stake snapshot for arbitrators
    function _createArbitratorSnapshot(uint256 blockNumber) internal returns (uint256 totalWeight) {
        address[] memory currentArbitrators = qualifiedArbitrators;
        totalWeight = 0;
        
        for (uint256 i = 0; i < currentArbitrators.length; i++) {
            address arbitrator = currentArbitrators[i];
            if (arbitrators[arbitrator].isQualified && 
                arbitrators[arbitrator].stakedAmount >= arbitratorMinStake) {
                
                uint256 stake = arbitrators[arbitrator].stakedAmount;
                stakeSnapshots[arbitrator][blockNumber] = stake;
                totalWeight += stake;
            }
        }
        
        snapshotArbitrators[blockNumber] = currentArbitrators;
        return totalWeight;
    }
    
    // C. Open dispute
    function openDispute(bytes32 orderId, string memory reason) external nonReentrant {
        OrderMeta storage order = orders[orderId];
        
        // Validate dispute conditions
        require(
            order.status == OrderStatus.Delivered || order.status == OrderStatus.Confirmed,
            "Invalid order status for dispute"
        );
        require(
            order.buyer == msg.sender || order.agent == msg.sender,
            "Only order participants can open dispute"
        );
        require(!hasActiveDispute[orderId], "Dispute already exists for this order");
        require(orderEscrow[orderId] > 0, "No escrow funds to dispute");
        
        // Charge dispute fee
        require(usdtToken.transferFrom(msg.sender, address(this), disputeFeeFixed), 
               "Dispute fee payment failed");
        
        // Update order status
        order.status = OrderStatus.Disputed;
        
        // Create dispute record
        DisputeMeta storage dispute = disputes[orderId];
        dispute.orderId = orderId;
        dispute.opener = msg.sender;
        dispute.reason = reason;
        dispute.openedAt = block.timestamp;
        dispute.snapshotBlock = block.number;
        dispute.escrowFrozen = orderEscrow[orderId];
        dispute.votingDeadline = block.timestamp + disputeVotingPeriod;
        dispute.disputeFee = disputeFeeFixed;
        dispute.isFinalized = false;
        
        // Create arbitrator snapshot and freeze escrow
        uint256 totalStake = _createArbitratorSnapshot(block.number);
        require(totalStake > 0, "No qualified arbitrators available");
        
        escrowFrozen[orderId] = true;
        hasActiveDispute[orderId] = true;
        activeDisputes.push(orderId);
        
        emit DisputeOpened(orderId, msg.sender, reason, block.number, orderEscrow[orderId]);
    }
    
    // D. Submit evidence
    function submitEvidence(bytes32 orderId, string memory uriHash) external {
        require(hasActiveDispute[orderId], "No active dispute for this order");
        require(!disputes[orderId].isFinalized, "Dispute already finalized");
        
        OrderMeta memory order = orders[orderId];
        require(
            order.buyer == msg.sender || order.agent == msg.sender,
            "Only order participants can submit evidence"
        );
        
        disputes[orderId].evidenceHashes.push(uriHash);
        
        emit EvidenceSubmitted(orderId, msg.sender, uriHash);
    }
    
    // E. Vote on dispute
    function voteDispute(bytes32 orderId, DisputeOption option) external nonReentrant {
        DisputeMeta storage dispute = disputes[orderId];
        
        // Validate voting conditions
        require(hasActiveDispute[orderId], "No active dispute for this order");
        require(!dispute.isFinalized, "Dispute already finalized");
        require(block.timestamp <= dispute.votingDeadline, "Voting period ended");
        require(arbitrators[msg.sender].isQualified, "Not a qualified arbitrator");
        require(!dispute.hasVoted[msg.sender], "Already voted on this dispute");
        
        // Get voter's stake at snapshot
        uint256 voterWeight = stakeSnapshots[msg.sender][dispute.snapshotBlock];
        require(voterWeight >= arbitratorMinStake, "Insufficient stake at snapshot");
        
        // Record vote
        Vote storage vote = dispute.votes[msg.sender];
        vote.option = option;
        vote.weight = voterWeight;
        vote.votedAt = block.timestamp;
        vote.isValid = true;
        
        dispute.hasVoted[msg.sender] = true;
        dispute.voters.push(msg.sender);
        dispute.totalVotingWeight += voterWeight;
        dispute.optionWeights[option] += voterWeight;
        
        emit DisputeVoted(orderId, msg.sender, option, voterWeight);
        
        // Check for early finalization
        uint256 totalSnapshotWeight = 0;
        address[] memory snapshotArbs = snapshotArbitrators[dispute.snapshotBlock];
        for (uint256 i = 0; i < snapshotArbs.length; i++) {
            totalSnapshotWeight += stakeSnapshots[snapshotArbs[i]][dispute.snapshotBlock];
        }
        
        // If any option has supermajority, allow early finalization
        if (dispute.optionWeights[option] * 10000 >= totalSnapshotWeight * earlyFinalizationThreshold) {
            _finalizeDispute(orderId);
        }
    }
    
    // F. Finalize dispute
    function finalizeDispute(bytes32 orderId) external nonReentrant {
        DisputeMeta storage dispute = disputes[orderId];
        
        require(hasActiveDispute[orderId], "No active dispute for this order");
        require(!dispute.isFinalized, "Dispute already finalized");
        require(
            block.timestamp > dispute.votingDeadline || 
            dispute.voters.length >= minVotingParticipation,
            "Voting period not ended and insufficient participation"
        );
        
        _finalizeDispute(orderId);
    }
    
    // G. Internal finalization logic
    function _finalizeDispute(bytes32 orderId) internal {
        DisputeMeta storage dispute = disputes[orderId];
        require(dispute.voters.length >= minVotingParticipation, "Insufficient voter participation");
        
        // Determine winning option
        DisputeOption winningOption = DisputeOption.RefundBuyer;
        uint256 highestWeight = 0;
        
        for (uint8 i = 0; i <= uint8(DisputeOption.Split75); i++) {
            DisputeOption option = DisputeOption(i);
            if (dispute.optionWeights[option] > highestWeight) {
                highestWeight = dispute.optionWeights[option];
                winningOption = option;
            }
        }
        
        dispute.finalDecision = winningOption;
        dispute.isFinalized = true;
        
        // Calculate fund distribution
        uint256 escrowAmount = dispute.escrowFrozen;
        uint256 payToAgent = 0;
        uint256 refundToBuyer = 0;
        
        if (winningOption == DisputeOption.PayAgent) {
            payToAgent = escrowAmount;
        } else if (winningOption == DisputeOption.RefundBuyer) {
            refundToBuyer = escrowAmount;
        } else if (winningOption == DisputeOption.Split25) {
            payToAgent = (escrowAmount * 75) / 100;
            refundToBuyer = escrowAmount - payToAgent;
        } else if (winningOption == DisputeOption.Split50) {
            payToAgent = escrowAmount / 2;
            refundToBuyer = escrowAmount - payToAgent;
        } else if (winningOption == DisputeOption.Split75) {
            payToAgent = (escrowAmount * 25) / 100;
            refundToBuyer = escrowAmount - payToAgent;
        }
        
        // Execute fund distribution
        OrderMeta storage order = orders[orderId];
        
        if (payToAgent > 0) {
            agentWithdrawable[order.agent] += payToAgent;
            emit AgentWithdrawableUpdated(order.agent, agentWithdrawable[order.agent]);
        }
        
        if (refundToBuyer > 0) {
            // Refund to buyer's balance pool
            claimedBalances[order.buyer][order.agent][order.category] -= refundToBuyer;
        }
        
        // Reset escrow
        orderEscrow[orderId] = 0;
        escrowFrozen[orderId] = false;
        
        // Process arbitrator rewards and penalties
        _processArbitratorRewards(orderId, winningOption, highestWeight);
        
        // Update order status
        order.status = OrderStatus.Closed;
        
        // Remove from active disputes
        _removeFromActiveDisputes(orderId);
        hasActiveDispute[orderId] = false;
        
        emit OrderEscrowUpdated(orderId, escrowAmount, 0, "dispute-finalized");
        emit DisputeFinalized(orderId, winningOption, payToAgent, refundToBuyer, 
                             dispute.disputeFee, 0);
        emit OrderClosed(orderId, payToAgent + refundToBuyer, address(0));
    }
    
    // H. Process arbitrator rewards and penalties
    function _processArbitratorRewards(
        bytes32 orderId,
        DisputeOption winningOption,
        uint256 winningWeight
    ) internal {
        DisputeMeta storage dispute = disputes[orderId];
        
        // Calculate reward pool (dispute fee + any slashing)
        uint256 rewardPool = dispute.disputeFee;
        uint256 totalSlashed = 0;
        
        // Calculate slashing for minority voters
        uint256 minorityWeight = dispute.totalVotingWeight - winningWeight;
        if (minorityWeight > 0) {
            for (uint256 i = 0; i < dispute.voters.length; i++) {
                address voter = dispute.voters[i];
                Vote storage vote = dispute.votes[voter];
                
                if (vote.option != winningOption) {
                    uint256 voterStake = vote.weight;
                    uint256 slashAmount = (voterStake * slashingRateLimit) / 10000;
                    
                    if (slashAmount > 0) {
                        arbitrators[voter].stakedAmount -= slashAmount;
                        totalSlashed += slashAmount;
                        rewardPool += slashAmount;
                        
                        emit ArbitratorSlashed(voter, slashAmount, orderId);
                    }
                }
            }
        }
        
        // Distribute rewards to winning voters
        uint256 platformFee = (rewardPool * platformFeeRate) / 10000;
        platformTreasury += platformFee;
        uint256 distributableReward = rewardPool - platformFee;
        
        if (winningWeight > 0 && distributableReward > 0) {
            for (uint256 i = 0; i < dispute.voters.length; i++) {
                address voter = dispute.voters[i];
                Vote storage vote = dispute.votes[voter];
                
                if (vote.option == winningOption) {
                    uint256 voterReward = (distributableReward * vote.weight) / winningWeight;
                    arbitratorRewards[voter] += voterReward;
                    
                    emit ArbitratorRewarded(voter, voterReward, orderId);
                }
            }
        }
    }
    
    // I. Utility function to remove dispute from active list
    function _removeFromActiveDisputes(bytes32 orderId) internal {
        for (uint256 i = 0; i < activeDisputes.length; i++) {
            if (activeDisputes[i] == orderId) {
                activeDisputes[i] = activeDisputes[activeDisputes.length - 1];
                activeDisputes.pop();
                break;
            }
        }
    }
    
    // H. View functions for order management
    function getOrder(bytes32 orderId) external view returns (OrderMeta memory) {
        return orders[orderId];
    }
    
    function getOrderStatus(bytes32 orderId) external view returns (OrderStatus) {
        return orders[orderId].status;
    }
    
    function getUserOrders(address user) external view returns (bytes32[] memory) {
        return userOrders[user];
    }
    
    function getAgentOrders(address agent) external view returns (bytes32[] memory) {
        return agentOrders[agent];
    }
    
    function getAllOrderIds() external view returns (bytes32[] memory) {
        return orderIds;
    }
    
    function getActiveOrders() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < orderIds.length; i++) {
            OrderStatus status = orders[orderIds[i]].status;
            if (status == OrderStatus.Opened || status == OrderStatus.Delivered) {
                activeCount++;
            }
        }
        
        // Collect active orders
        bytes32[] memory activeOrders = new bytes32[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            OrderStatus status = orders[orderIds[i]].status;
            if (status == OrderStatus.Opened || status == OrderStatus.Delivered) {
                activeOrders[currentIndex] = orderIds[i];
                currentIndex++;
            }
        }
        
        return activeOrders;
    }
    
    function getOrdersByStatus(OrderStatus targetStatus) external view returns (bytes32[] memory) {
        uint256 matchingCount = 0;
        
        // Count matching orders
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == targetStatus) {
                matchingCount++;
            }
        }
        
        // Collect matching orders
        bytes32[] memory matchingOrders = new bytes32[](matchingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == targetStatus) {
                matchingOrders[currentIndex] = orderIds[i];
                currentIndex++;
            }
        }
        
        return matchingOrders;
    }
    
    // I. Admin functions for order management
    function cancelExpiredProposals(bytes32[] memory expiredOrderIds) external onlyOwner {
        for (uint256 i = 0; i < expiredOrderIds.length; i++) {
            OrderMeta storage order = orders[expiredOrderIds[i]];
            if (order.status == OrderStatus.Proposed && 
                block.timestamp > order.proposedAt + 7 days) {
                order.status = OrderStatus.Closed;
                emit OrderClosed(expiredOrderIds[i], 0, address(0));
            }
        }
    }
    
    // J. Integration helper functions
    function isOrderReadyForPayment(bytes32 orderId) external view returns (bool) {
        OrderMeta memory order = orders[orderId];
        return order.status == OrderStatus.Confirmed;
    }
    
    function canInitiateDispute(bytes32 orderId, address user) external view returns (bool) {
        OrderMeta memory order = orders[orderId];
        return (order.buyer == user || order.agent == user) &&
               (order.status == OrderStatus.Delivered || order.status == OrderStatus.Confirmed);
    }
    
    function validateOrderBudget(address buyer, address agent, bytes32 category, uint256 budget) 
        external view returns (bool sufficient, uint256 available, uint256 agentCapacity) {
        available = this.availableBalance(buyer, agent, category);
        agentCapacity = agents[agent].stakedAmount;
        sufficient = (available >= budget && budget <= agentCapacity);
    }
    
    // J. Arbitrator reward withdrawal
    function withdrawArbitratorRewards() external nonReentrant {
        require(arbitrators[msg.sender].isQualified, "Not a qualified arbitrator");
        uint256 reward = arbitratorRewards[msg.sender];
        require(reward > 0, "No rewards to withdraw");
        
        arbitratorRewards[msg.sender] = 0;
        require(usdtToken.transfer(msg.sender, reward), "Reward transfer failed");
    }
    
    // K. View functions for dispute system
    function getDisputeInfo(bytes32 orderId) external view returns (
        address opener,
        string memory reason,
        uint256 openedAt,
        uint256 votingDeadline,
        uint256 escrowFrozen,
        bool isFinalized,
        DisputeOption finalDecision
    ) {
        DisputeMeta storage dispute = disputes[orderId];
        return (
            dispute.opener,
            dispute.reason,
            dispute.openedAt,
            dispute.votingDeadline,
            dispute.escrowFrozen,
            dispute.isFinalized,
            dispute.finalDecision
        );
    }
    
    function getDisputeVotingStats(bytes32 orderId) external view returns (
        uint256 totalVotingWeight,
        uint256[] memory optionWeights,
        uint256 voterCount
    ) {
        DisputeMeta storage dispute = disputes[orderId];
        optionWeights = new uint256[](5);
        
        for (uint8 i = 0; i <= 4; i++) {
            optionWeights[i] = dispute.optionWeights[DisputeOption(i)];
        }
        
        return (
            dispute.totalVotingWeight,
            optionWeights,
            dispute.voters.length
        );
    }
    
    function getActiveDisputes() external view returns (bytes32[] memory) {
        return activeDisputes;
    }
    
    function getOrderEscrowAmount(bytes32 orderId) external view returns (uint256) {
        return orderEscrow[orderId];
    }
    
    function isEscrowFrozen(bytes32 orderId) external view returns (bool) {
        return escrowFrozen[orderId];
    }
    
    function getArbitratorReward(address arbitrator) external view returns (uint256) {
        return arbitratorRewards[arbitrator];
    }
    
    function getArbitratorStakeAtSnapshot(address arbitrator, uint256 blockNumber) 
        external view returns (uint256) {
        return stakeSnapshots[arbitrator][blockNumber];
    }
    
    // L. Admin functions for dispute system parameters
    function updateDisputeVotingPeriod(uint256 newPeriod) external onlyOwner {
        disputeVotingPeriod = newPeriod;
    }
    
    function updateEarlyFinalizationThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 10000, "Threshold cannot exceed 100%");
        earlyFinalizationThreshold = newThreshold;
    }
    
    function updateMinVotingParticipation(uint256 newMin) external onlyOwner {
        minVotingParticipation = newMin;
    }
    
    function updateSlashingRateLimit(uint256 newLimit) external onlyOwner {
        require(newLimit <= 2000, "Slashing rate cannot exceed 20%");
        slashingRateLimit = newLimit;
    }
    
    function updateDisputeFee(uint256 newFee) external onlyOwner {
        disputeFeeFixed = newFee;
    }
    
    function updatePlatformFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Platform fee cannot exceed 20%");
        platformFeeRate = newRate;
    }
    
    function withdrawPlatformTreasury(address to, uint256 amount) external onlyOwner {
        require(amount <= platformTreasury, "Insufficient treasury balance");
        platformTreasury -= amount;
        require(usdtToken.transfer(to, amount), "Treasury withdrawal failed");
    }
}