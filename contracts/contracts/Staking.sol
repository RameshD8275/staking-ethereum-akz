// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Pausable, Ownable {
    IERC20 public immutable stakingToken;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public schemeCount;

    struct StakingScheme {
        uint256 minStake;
        uint256 maxStake;
        uint256 stakeDuration;
        uint256 rewardDuration;
        uint256 apy;
        bool isActive;
        uint256 cooldownPeriod;
        uint256 minRewardPeriod;
        uint256 earlyUnstakePenalty;
        uint256 maxRewardClaim;
        uint256 rewardRate;
        uint256 totalStaked;
        uint256 withdrawLimit;
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 schemeId;
        bool isActive;
        uint256 stakeIndex;
        uint256 lastRewardTime;
        uint256 accumulatedReward;
        uint256 rewardDebt;
    }

    mapping(uint256 => StakingScheme) public schemes;
    mapping(address => mapping(uint256 => mapping(uint256 => Stake))) public userStakes;
    mapping(address => mapping(uint256 => uint256)) public totalUserStakesByScheme;
    mapping(address => mapping(uint256 => uint256)) public lastStakeTime;
    mapping(address => mapping(uint256 => uint256)) public totalClaimedRewards;

    event Staked(address indexed user, uint256 indexed schemeId, uint256 amount, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 indexed schemeId, uint256 amount, uint256 reward, uint256 stakeIndex);
    event RewardClaimed(address indexed user, uint256 indexed schemeId, uint256 stakeIndex, uint256 reward);
    event SchemeCreated(uint256 indexed schemeId, uint256 minStake, uint256 maxStake, uint256 apy);
    event SchemeUpdated(uint256 indexed schemeId, uint256 apy, uint256 rewardRate);
    event EmergencyWithdrawn(address indexed user, uint256 indexed schemeId, uint256 amount, uint256 penalty);
    event RewardAccumulated(address indexed user, uint256 indexed schemeId, uint256 stakeIndex, uint256 reward);

    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
        _addInitialSchemes();
    }

    function _calculateRewardRate(uint256 _apy) internal pure returns (uint256) {
        return (_apy * PRECISION) / (365 days * BASIS_POINTS);
    }

    struct SchemeParams {
        uint256 minStake;
        uint256 maxStake;
        uint256 stakeDuration;
        uint256 rewardDuration;
        uint256 apy;
        uint256 cooldownPeriod;
        uint256 minRewardPeriod;
        uint256 earlyUnstakePenalty;
        uint256 maxRewardClaim;
        uint256 withdrawLimit;
        bool isActive;
    }
    
    function addScheme(SchemeParams memory params) public onlyOwner {
        require(params.minStake > 0, "Min stake must be > 0");
        require(params.maxStake > params.minStake, "Max stake must be > min stake");
        require(params.stakeDuration > 0, "Stake duration must be > 0");
        require(params.rewardDuration > 0, "Reward duration must be > 0");
        require(params.apy > 0, "APY must be > 0");
        require(params.cooldownPeriod > 0, "Cooldown period must be > 0");
        require(params.minRewardPeriod > 0, "Min reward period must be > 0");
        require(params.earlyUnstakePenalty <= 3000, "Penalty too high");
        require(params.maxRewardClaim > 0, "Max reward claim must be > 0");
        require(params.withdrawLimit > 0, "Withdraw limit must be > 0");
        
        uint256 rewardRate = _calculateRewardRate(params.apy);
        
        schemeCount++;
        schemes[schemeCount] = StakingScheme({
            minStake: params.minStake,
            maxStake: params.maxStake,
            stakeDuration: params.stakeDuration,
            rewardDuration: params.rewardDuration,
            apy: params.apy,
            isActive: params.isActive,
            cooldownPeriod: params.cooldownPeriod,
            minRewardPeriod: params.minRewardPeriod,
            earlyUnstakePenalty: params.earlyUnstakePenalty,
            maxRewardClaim: params.maxRewardClaim,
            rewardRate: rewardRate,
            totalStaked: 0,
            withdrawLimit: params.withdrawLimit
        });
        
        emit SchemeCreated(schemeCount, params.minStake, params.maxStake, params.apy);
    }

    function stake(uint256 _schemeId, uint256 _amount) external whenNotPaused {
        StakingScheme storage scheme = schemes[_schemeId];
        require(scheme.isActive, "Scheme not active");
        require(_amount >= scheme.minStake, "Amount below min stake");
        require(
            totalUserStakesByScheme[msg.sender][_schemeId] + _amount <= scheme.maxStake,
            "Exceeds max stake"
        );

        uint256 lastStake = lastStakeTime[msg.sender][_schemeId];
        require(
            lastStake == 0 || block.timestamp >= lastStake + scheme.cooldownPeriod,
            "Cooldown period active"
        );

        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        uint256 stakeIndex = totalUserStakesByScheme[msg.sender][_schemeId];
        userStakes[msg.sender][_schemeId][stakeIndex] = Stake({
            amount: _amount,
            startTime: block.timestamp,
            schemeId: _schemeId,
            isActive: true,
            stakeIndex: stakeIndex,
            lastRewardTime: block.timestamp,
            accumulatedReward: 0,
            rewardDebt: 0
        });

        totalUserStakesByScheme[msg.sender][_schemeId]++;
        scheme.totalStaked += _amount;
        lastStakeTime[msg.sender][_schemeId] = block.timestamp;

        emit Staked(msg.sender, _schemeId, _amount, stakeIndex);
    }

    function unstake(uint256 _schemeId, uint256 _stakeIndex) external whenNotPaused {
        Stake storage userStake = userStakes[msg.sender][_schemeId][_stakeIndex];
        require(userStake.isActive, "Stake not active");
        
        StakingScheme storage scheme = schemes[_schemeId];
        
        // Check if lock period is completed
        bool isLockPeriodComplete = block.timestamp >= userStake.startTime + scheme.stakeDuration;
        require(isLockPeriodComplete, "Lock period not completed");

        uint256 reward = calculateReward(msg.sender, _schemeId, _stakeIndex);
        userStake.isActive = false;
        scheme.totalStaked -= userStake.amount;

        // Transfer principal amount
        require(stakingToken.transfer(msg.sender, userStake.amount), "Transfer failed");

        // Transfer rewards if any
        if (reward > 0) {
            require(stakingToken.transfer(msg.sender, reward), "Reward transfer failed");
            totalClaimedRewards[msg.sender][_schemeId] += reward;
        }

        emit Unstaked(msg.sender, _schemeId, userStake.amount, reward, _stakeIndex);
    }

    function emergencyWithdraw(uint256 _schemeId, uint256 _stakeIndex) external whenNotPaused {
        Stake storage userStake = userStakes[msg.sender][_schemeId][_stakeIndex];
        require(userStake.isActive, "Stake not active");

        StakingScheme storage scheme = schemes[_schemeId];
        uint256 penalty = (userStake.amount * scheme.earlyUnstakePenalty) / BASIS_POINTS;
        uint256 amountAfterPenalty = userStake.amount - penalty;

        userStake.isActive = false;
        scheme.totalStaked -= userStake.amount;

        require(stakingToken.transfer(msg.sender, amountAfterPenalty), "Transfer failed");

        emit EmergencyWithdrawn(msg.sender, _schemeId, amountAfterPenalty, penalty);
    }

    function claimReward(uint256 _schemeId, uint256 _stakeIndex) external whenNotPaused {
        Stake storage userStake = userStakes[msg.sender][_schemeId][_stakeIndex];
        require(userStake.isActive, "Stake not active");
        
        StakingScheme storage scheme = schemes[_schemeId];
        
        // Check if lock period is still active
        bool isLockPeriodActive = block.timestamp < userStake.startTime + scheme.stakeDuration;
        require(isLockPeriodActive, "Lock period completed, use unstake");

        uint256 reward = calculateReward(msg.sender, _schemeId, _stakeIndex);
        require(reward > 0, "No reward to claim");
        require(reward <= scheme.maxRewardClaim, "Exceeds max claim");

        require(
            block.timestamp >= userStake.lastRewardTime + scheme.minRewardPeriod,
            "Min reward period not met"
        );

        userStake.lastRewardTime = block.timestamp;
        userStake.accumulatedReward += reward;
        totalClaimedRewards[msg.sender][_schemeId] += reward;

        require(stakingToken.transfer(msg.sender, reward), "Transfer failed");

        emit RewardClaimed(msg.sender, _schemeId, _stakeIndex, reward);
    }

    function calculateReward(
        address _user,
        uint256 _schemeId,
        uint256 _stakeIndex
    ) public view returns (uint256) {
        Stake storage userStake = userStakes[_user][_schemeId][_stakeIndex];
        if (!userStake.isActive) return 0;

        StakingScheme storage scheme = schemes[_schemeId];
        
        // Check if lock period is completed
        if (block.timestamp >= userStake.startTime + scheme.stakeDuration) {
            return 0; // No rewards after lock period
        }

        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        if (timeElapsed == 0) return 0;

        uint256 reward = (userStake.amount * scheme.rewardRate * timeElapsed) / PRECISION;
        uint256 maxReward = (userStake.amount * scheme.apy) / BASIS_POINTS;

        return reward > maxReward ? maxReward : reward;
    }

    function _addInitialSchemes() internal {
        // Bronze Plan
        addScheme(SchemeParams({
            minStake: 20 ether,
            maxStake: 1000 ether,
            stakeDuration: 15 days,
            rewardDuration: 15 days,
            apy: 3,
            cooldownPeriod: 1 days,
            minRewardPeriod: 1 days,
            earlyUnstakePenalty: 500,
            maxRewardClaim: 100 ether,
            withdrawLimit: 1000 ether,
            isActive: true
        }));
        
        // Silver Plan
        addScheme(SchemeParams({
            minStake: 1001 ether,
            maxStake: 2000 ether,
            stakeDuration: 30 days,
            rewardDuration: 30 days,
            apy: 8,
            cooldownPeriod: 2 days,
            minRewardPeriod: 2 days,
            earlyUnstakePenalty: 750,
            maxRewardClaim: 200 ether,
            withdrawLimit: 2000 ether,
            isActive: true
        }));
        
        // Gold Plan
        addScheme(SchemeParams({
            minStake: 2001 ether,
            maxStake: 5000 ether,
            stakeDuration: 90 days,
            rewardDuration: 90 days,
            apy: 30,
            cooldownPeriod: 3 days,
            minRewardPeriod: 3 days,
            earlyUnstakePenalty: 1000,
            maxRewardClaim: 500 ether,
            withdrawLimit: 5000 ether,
            isActive: true
        }));
        
        // Quick Plan
        addScheme(SchemeParams({
            minStake: 10 ether,
            maxStake: 100 ether,
            stakeDuration: 1 hours,
            rewardDuration: 30 minutes,
            apy: 2,
            cooldownPeriod: 15 minutes,
            minRewardPeriod: 15 minutes,
            earlyUnstakePenalty: 250,
            maxRewardClaim: 50 ether,
            withdrawLimit: 100 ether,
            isActive: true
        }));
    }

    function updateSchemeAPY(uint256 _schemeId, uint256 _newAPY) external onlyOwner {
        require(_newAPY > 0, "APY must be > 0");
        StakingScheme storage scheme = schemes[_schemeId];
        scheme.apy = _newAPY;
        scheme.rewardRate = _calculateRewardRate(_newAPY);
        emit SchemeUpdated(_schemeId, _newAPY, scheme.rewardRate);
    }

    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(stakingToken.transfer(msg.sender, _amount), "Transfer failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getTotalStaked(address _user, uint256 _schemeId) external view returns (uint256) {
        return totalUserStakesByScheme[_user][_schemeId];
    }

    function getUserStakes(address _user, uint256 _schemeId) external view returns (Stake[] memory) {
        uint256 totalStakes = totalUserStakesByScheme[_user][_schemeId];
        Stake[] memory stakes = new Stake[](totalStakes);
        
        for (uint256 i = 0; i < totalStakes; i++) {
            stakes[i] = userStakes[_user][_schemeId][i];
        }
        
        return stakes;
    }

    function getSchemeStats(uint256 _schemeId) external view returns (
        uint256 totalStaked,
        uint256 apy,
        uint256 rewardRate
    ) {
        StakingScheme storage scheme = schemes[_schemeId];
        return (scheme.totalStaked, scheme.apy, scheme.rewardRate);
    }

    function getTotalClaimedRewards(address _user, uint256 _schemeId) external view returns (uint256) {
        return totalClaimedRewards[_user][_schemeId];
    }
}