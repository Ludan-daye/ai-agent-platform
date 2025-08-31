// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentPlatformCore is ReentrancyGuard, Ownable {
    IERC20 public usdtToken;
    
    // Minimum staking thresholds
    uint256 public agentMinStake = 100 * 10**6; // 100 USDT (assuming 6 decimals)
    uint256 public arbitratorMinStake = 500 * 10**6; // 500 USDT
    
    // Ranking weight factors (sum should be 100 for percentage)
    uint256 public constant STAKE_WEIGHT = 60; // Collateral weight 60%
    uint256 public constant PERFORMANCE_WEIGHT = 25; // Recent performance 25%
    uint256 public constant QUALITY_WEIGHT = 10; // Quality score 10%
    uint256 public constant ACTIVITY_WEIGHT = 5; // Activity consistency 5%
    
    enum Role { None, Agent, Client, Arbitrator }
    enum TaskStatus { Created, InProgress, Completed, Disputed, Resolved }
    
    struct Agent {
        address agentAddress;
        uint256 totalStaked;
        uint256 totalEarned;
        uint256 completedTasks;
        uint256 successfulTasks;
        uint256 reputation;
        uint256 lastActiveTime;
        bool isActive;
        string[] keywords;
    }
    
    struct Client {
        address clientAddress;
        uint256 totalSpent;
        uint256 tasksCreated;
        uint256 averageRating;
        bool isActive;
    }
    
    struct Task {
        uint256 taskId;
        address client;
        address agent;
        uint256 amount;
        string description;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
        uint256 rating;
    }
    
    mapping(address => Role) public userRoles;
    mapping(address => Agent) public agents;
    mapping(address => Client) public clients;
    mapping(address => uint256) public userBalances;
    mapping(uint256 => Task) public tasks;
    
    uint256 public nextTaskId = 1;
    uint256 public totalAgents;
    uint256 public totalTasks;
    
    event AgentRegistered(address indexed agent, uint256 stakeAmount);
    event ClientRegistered(address indexed client);
    event TaskCreated(uint256 indexed taskId, address indexed client, address indexed agent, uint256 amount);
    event TaskCompleted(uint256 indexed taskId, uint256 rating);
    event StakeIncreased(address indexed agent, uint256 amount);
    
    constructor(address _usdtToken) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
    }
    
    function registerAsAgent(uint256 _stakeAmount, string[] memory _keywords) external {
        require(_stakeAmount >= agentMinStake, "Insufficient stake amount");
        require(userRoles[msg.sender] == Role.None, "User already registered");
        require(_keywords.length > 0 && _keywords.length <= 5, "Invalid keywords count");
        
        usdtToken.transferFrom(msg.sender, address(this), _stakeAmount);
        
        agents[msg.sender] = Agent({
            agentAddress: msg.sender,
            totalStaked: _stakeAmount,
            totalEarned: 0,
            completedTasks: 0,
            successfulTasks: 0,
            reputation: 100,
            lastActiveTime: block.timestamp,
            isActive: true,
            keywords: _keywords
        });
        
        userRoles[msg.sender] = Role.Agent;
        totalAgents++;
        
        emit AgentRegistered(msg.sender, _stakeAmount);
    }
    
    function registerAsClient() external {
        require(userRoles[msg.sender] == Role.None, "User already registered");
        
        clients[msg.sender] = Client({
            clientAddress: msg.sender,
            totalSpent: 0,
            tasksCreated: 0,
            averageRating: 0,
            isActive: true
        });
        
        userRoles[msg.sender] = Role.Client;
        
        emit ClientRegistered(msg.sender);
    }
    
    function createTask(address _agent, uint256 _amount, string memory _description) external {
        require(userRoles[msg.sender] == Role.Client, "Only clients can create tasks");
        require(userRoles[_agent] == Role.Agent, "Invalid agent");
        require(_amount > 0, "Amount must be positive");
        require(agents[_agent].isActive, "Agent not active");
        
        usdtToken.transferFrom(msg.sender, address(this), _amount);
        
        tasks[nextTaskId] = Task({
            taskId: nextTaskId,
            client: msg.sender,
            agent: _agent,
            amount: _amount,
            description: _description,
            status: TaskStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0,
            rating: 0
        });
        
        clients[msg.sender].tasksCreated++;
        totalTasks++;
        
        emit TaskCreated(nextTaskId, msg.sender, _agent, _amount);
        nextTaskId++;
    }
    
    function completeTask(uint256 _taskId, uint256 _rating) external {
        Task storage task = tasks[_taskId];
        require(task.client == msg.sender, "Only task client can complete");
        require(task.status == TaskStatus.Created, "Task not in created status");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        task.rating = _rating;
        
        Agent storage agent = agents[task.agent];
        agent.completedTasks++;
        agent.totalEarned += task.amount;
        agent.lastActiveTime = block.timestamp;
        
        if (_rating >= 3) {
            agent.successfulTasks++;
        }
        
        // Transfer payment to agent
        usdtToken.transfer(task.agent, task.amount);
        
        // Update client stats
        Client storage client = clients[task.client];
        client.totalSpent += task.amount;
        
        emit TaskCompleted(_taskId, _rating);
    }
    
    function calculateAgentRanking(address _agent) public view returns (uint256) {
        Agent memory agent = agents[_agent];
        if (!agent.isActive) return 0;
        
        // Stake score (60%)
        uint256 stakeScore = (agent.totalStaked * 100) / agentMinStake;
        if (stakeScore > 500) stakeScore = 500; // Cap at 500%
        
        // Performance score (25%)
        uint256 performanceScore = 0;
        if (agent.completedTasks > 0) {
            performanceScore = (agent.successfulTasks * 100) / agent.completedTasks;
        }
        
        // Quality score (10%) - based on reputation
        uint256 qualityScore = agent.reputation;
        
        // Activity score (5%) - based on recent activity
        uint256 activityScore = 100;
        uint256 daysSinceActive = (block.timestamp - agent.lastActiveTime) / 86400;
        if (daysSinceActive > 7) {
            activityScore = daysSinceActive > 30 ? 0 : 100 - (daysSinceActive * 10 / 3);
        }
        
        return (
            (stakeScore * STAKE_WEIGHT) + 
            (performanceScore * PERFORMANCE_WEIGHT) + 
            (qualityScore * QUALITY_WEIGHT) + 
            (activityScore * ACTIVITY_WEIGHT)
        ) / 100;
    }
    
    function getAgentDetails(address _agent) external view returns (Agent memory) {
        return agents[_agent];
    }
    
    function getTaskDetails(uint256 _taskId) external view returns (Task memory) {
        return tasks[_taskId];
    }
    
    function getClientDetails(address _client) external view returns (Client memory) {
        return clients[_client];
    }
    
    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }
    
    function increaseStake(uint256 _amount) external {
        require(userRoles[msg.sender] == Role.Agent, "Only agents can increase stake");
        require(_amount > 0, "Amount must be positive");
        
        usdtToken.transferFrom(msg.sender, address(this), _amount);
        agents[msg.sender].totalStaked += _amount;
        agents[msg.sender].lastActiveTime = block.timestamp;
        
        emit StakeIncreased(msg.sender, _amount);
    }
}