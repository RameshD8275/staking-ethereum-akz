// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Staking is Ownable, ReentrancyGuard, Pausable {
    IERC20 public stakingToken;

    struct StakingScheme {
        uint256 minStake;
        uint256 maxStake;
        uint256 stakeDuration;
        uint256 rewardDuration;
        uint256 apy;
        bool isActive;
    }

    struct Stake {
        uint256 amount;
        uint256 lastRewardAt;
        uint256 lockUntil;
        uint256 schemeId;
        bool isActive;
        uint256 stakeIndex;
    }

    mapping(uint256 => StakingScheme) public schemes;
    mapping(address => mapping(uint256 => Stake[])) public userStakes;
    mapping(address => mapping(uint256 => uint256))
        public totalUserStakesByScheme;
    uint256 public schemeCount = 4;

    event SchemeCreated(
        uint256 indexed schemeId,
        uint256 minStake,
        uint256 maxStake,
        uint256 apy
    );
    event Staked(
        address indexed user,
        uint256 indexed schemeId,
        uint256 amount,
        uint256 stakeIndex
    );
    event Unstaked(
        address indexed user,
        uint256 indexed schemeId,
        uint256 amount,
        uint256 reward,
        uint256 stakeIndex
    );
    event claimed(
        address indexed user,
        uint256 indexed schemeId,
        uint256 reward,
        uint256 stakeIndex
    );

    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        schemes[1] = StakingScheme({
            minStake: 100 * 10 ** 18,
            maxStake: 1000 * 10 ** 18,
            stakeDuration: 364 days,
            rewardDuration: 1 days,
            apy: 546,
            isActive: true
        });
        schemes[2] = StakingScheme({
            minStake: 1001 * 10 ** 18,
            maxStake: 2000 * 10 ** 18,
            stakeDuration: 364 days,
            rewardDuration: 7 days,
            apy: 650,
            isActive: true
        });
        schemes[3] = StakingScheme({
            minStake: 2001 * 10 ** 18,
            maxStake: 5000 * 10 ** 18,
            stakeDuration: 364 days,
            rewardDuration: 15 days,
            apy: 720,
            isActive: true
        });
        schemes[4] = StakingScheme({
            minStake: 2001 * 10 ** 18,
            maxStake: 5000 * 10 ** 18,
            stakeDuration: 364 days,
            rewardDuration: 30 days,
            apy: 960,
            isActive: true
        });
    }

    function addScheme(
        uint256 _minStake,
        uint256 _maxStake,
        uint256 _stakeDuration,
        uint256 _rewardDuration,
        uint256 _apy
    ) external onlyOwner {
        require(_minStake > 0, "Min stake must be > 0");
        require(_maxStake > _minStake, "Max stake must be > min stake");
        require(_stakeDuration > 0, "Stake duration must be > 0");
        require(_rewardDuration > 0, "Reward duration must be > 0");
        require(_apy > 0, "APY must be > 0");

        schemeCount++;
        schemes[schemeCount] = StakingScheme({
            minStake: _minStake,
            maxStake: _maxStake,
            stakeDuration: _stakeDuration,
            rewardDuration: _rewardDuration,
            apy: _apy,
            isActive: true
        });

        emit SchemeCreated(schemeCount, _minStake, _maxStake, _apy);
    }

    function stake(
        uint256 _schemeId,
        uint256 _amount
    ) external nonReentrant whenNotPaused {
        StakingScheme storage scheme = schemes[_schemeId];
        require(scheme.isActive, "Scheme not active");
        require(_amount >= scheme.minStake, "Amount < min stake");

        uint256 newTotal = totalUserStakesByScheme[msg.sender][_schemeId] +
            _amount;
        require(newTotal <= scheme.maxStake, "Total would exceed max stake");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        uint256 stakeIndex = userStakes[msg.sender][_schemeId].length;
        userStakes[msg.sender][_schemeId].push(
            Stake({
                amount: _amount,
                lastRewardAt: block.timestamp,
                lockUntil: block.timestamp + scheme.stakeDuration,
                schemeId: _schemeId,
                isActive: true,
                stakeIndex: stakeIndex
            })
        );

        totalUserStakesByScheme[msg.sender][_schemeId] = newTotal;

        emit Staked(msg.sender, _schemeId, _amount, stakeIndex);
    }

    function calculateReward(
        address _user,
        uint256 _schemeId,
        uint256 _stakeIndex
    ) public view returns (uint256) {
        require(
            _stakeIndex < userStakes[_user][_schemeId].length,
            "Invalid stake index"
        );
        Stake storage userStake = userStakes[_user][_schemeId][_stakeIndex];
        StakingScheme storage scheme = schemes[_schemeId];

        if (!userStake.isActive) return 0;

        uint256 timeStaked;
        if (userStake.lockUntil > block.timestamp)
            timeStaked = block.timestamp - userStake.lastRewardAt;
        else timeStaked = userStake.lockUntil - userStake.lastRewardAt;

        if (timeStaked < scheme.stakeDuration) return 0;

        uint256 periods = timeStaked / scheme.rewardDuration;
        uint256 reward = (userStake.amount * scheme.apy * periods) /
            ((100 * 10 * 365 days) / scheme.rewardDuration);
        return reward;
    }

    function unstake(
        uint256 _schemeId,
        uint256 _stakeIndex
    ) external nonReentrant {
        require(
            _stakeIndex < userStakes[msg.sender][_schemeId].length,
            "Invalid stake index"
        );
        Stake storage userStake = userStakes[msg.sender][_schemeId][
            _stakeIndex
        ];
        require(userStake.isActive, "No active stake");
        require(
            userStake.lockUntil >= block.timestamp,
            "Stake duration not met"
        );

        uint256 reward = calculateReward(msg.sender, _schemeId, _stakeIndex);
        uint256 totalAmount = userStake.amount + reward;
        userStake.lastRewardAt = block.timestamp;
        userStake.isActive = false;
        totalUserStakesByScheme[msg.sender][_schemeId] -= userStake.amount;

        require(
            stakingToken.transfer(msg.sender, totalAmount),
            "Transfer failed"
        );

        emit Unstaked(
            msg.sender,
            _schemeId,
            userStake.amount,
            reward,
            _stakeIndex
        );
    }

    function claim(
        uint256 _schemeId,
        uint256 _stakeIndex
    ) external nonReentrant {
        require(
            _stakeIndex < userStakes[msg.sender][_schemeId].length,
            "Invalid stake index"
        );
        Stake storage userStake = userStakes[msg.sender][_schemeId][
            _stakeIndex
        ];
        require(userStake.isActive, "No active stake");

        uint256 reward = calculateReward(msg.sender, _schemeId, _stakeIndex);
        userStake.lastRewardAt = block.timestamp;

        require(stakingToken.transfer(msg.sender, reward), "Transfer failed");

        emit claimed(msg.sender, _schemeId, reward, _stakeIndex);
    }
    function getExpiredDay(
        uint256 _schemeId,
        uint256 _stakeIndex
    ) public view returns (uint256) {
        Stake storage userStake = userStakes[msg.sender][_schemeId][
            _stakeIndex
        ];
        return userStake.lockUntil;
    }
    function getRewardExpiredDay(
        uint256 _schemeId,
        uint256 _stakeIndex
    ) public view returns (uint256) {
        Stake storage userStake = userStakes[msg.sender][_schemeId][
            _stakeIndex
        ];
        StakingScheme storage scheme = schemes[_schemeId];

        uint256 timeStaked;
        if (userStake.lockUntil > block.timestamp)
            timeStaked = block.timestamp - userStake.lastRewardAt;
        else timeStaked = userStake.lockUntil - userStake.lastRewardAt;

        uint256 repeatReward = timeStaked / scheme.rewardDuration;
        return userStake.lastRewardAt + scheme.rewardDuration * repeatReward;
    }
    function emergencyWithdraw(
        uint256 _schemeId,
        uint256 _stakeIndex
    ) external nonReentrant {
        require(
            _stakeIndex < userStakes[msg.sender][_schemeId].length,
            "Invalid stake index"
        );
        Stake storage userStake = userStakes[msg.sender][_schemeId][
            _stakeIndex
        ];
        require(userStake.isActive, "No active stake");

        uint256 amount = userStake.amount;
        userStake.isActive = false;
        totalUserStakesByScheme[msg.sender][_schemeId] -= amount;

        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, _schemeId, amount, 0, _stakeIndex);
    }

    function getUserStakes(
        address _user,
        uint256 _schemeId
    ) external view returns (Stake[] memory) {
        return userStakes[_user][_schemeId];
    }

    function getTotalStaked(
        address _user,
        uint256 _schemeId
    ) external view returns (uint256) {
        return totalUserStakesByScheme[_user][_schemeId];
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(stakingToken.transfer(owner(), _amount), "Transfer failed");
    }
}
