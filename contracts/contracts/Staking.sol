// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}
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
        uint256 startTime;
        uint256 schemeId;
        bool isActive;
        uint256 stakeIndex;
        uint256 accumulatedReward;
    }

    mapping(uint256 => StakingScheme) public schemes;
    mapping(address => mapping(uint256 => Stake[])) public userStakes;
    mapping(address => mapping(uint256 => uint256))
        public totalUserStakesByScheme;
    mapping(address => mapping(uint256 => uint256)) public totalClaimedRewards;

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
            apy: _apy * 10,
            isActive: true
        });

        emit SchemeCreated(schemeCount, _minStake, _maxStake, _apy);
    }

    function setScheme(
        uint256 _schemeId,
        uint256 _minStake,
        uint256 _maxStake,
        uint256 _stakeDuration,
        uint256 _rewardDuration,
        uint256 _apy,
        bool _isActive
    ) external onlyOwner {
        require(_minStake > 0, "Min stake must be > 0");
        require(_maxStake > _minStake, "Max stake must be > min stake");
        require(_stakeDuration > 0, "Stake duration must be > 0");
        require(_rewardDuration > 0, "Reward duration must be > 0");
        require(_apy > 0, "APY must be > 0");

        StakingScheme storage scheme = schemes[_schemeId];
        scheme.minStake = _minStake;
        scheme.maxStake = _maxStake;
        scheme.stakeDuration = _stakeDuration;
        scheme.rewardDuration = _rewardDuration;
        scheme.apy = _apy * 10;
        scheme.isActive = _isActive;
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
                startTime: block.timestamp,
                schemeId: _schemeId,
                isActive: true,
                stakeIndex: stakeIndex,
                accumulatedReward: 0
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

        uint256 reward = (userStake.amount *
            scheme.apy *
            _getRepeatNumberOfPeriods(_user, _schemeId, _stakeIndex)) /
            ((100 * 10 * 365 days) / scheme.rewardDuration);
        return reward;
    }

    function _getRepeatNumberOfPeriods(
        address _user,
        uint256 _schemeId,
        uint256 _stakeIndex
    ) internal view returns (uint256) {
        Stake storage userStake = userStakes[_user][_schemeId][_stakeIndex];
        StakingScheme storage scheme = schemes[_schemeId];
        uint256 timeStaked;
        if (userStake.startTime + scheme.stakeDuration > block.timestamp)
            timeStaked = block.timestamp - userStake.lastRewardAt;
        else
            timeStaked =
                userStake.startTime +
                scheme.stakeDuration -
                userStake.lastRewardAt;

        uint256 periods = timeStaked / scheme.rewardDuration;
        return periods;
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
        StakingScheme storage scheme = schemes[_schemeId];
        require(userStake.isActive, "No active stake");
        require(
            userStake.startTime + scheme.stakeDuration <= block.timestamp,
            "Stake duration not met"
        );

        uint256 reward = calculateReward(msg.sender, _schemeId, _stakeIndex);

        uint256 totalAmount = userStake.amount + reward;
        totalClaimedRewards[msg.sender][_schemeId] += reward;

        userStake.lastRewardAt = scheme.stakeDuration + userStake.startTime;
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
        StakingScheme storage scheme = schemes[_schemeId];
        require(userStake.isActive, "No active stake");
        require(
            userStake.lastRewardAt !=
                scheme.stakeDuration + userStake.startTime,
            "Staking Period has expired"
        );
        require(
            (block.timestamp - userStake.lastRewardAt) > scheme.rewardDuration,
            "Reward duration not met"
        );

        uint256 reward = calculateReward(msg.sender, _schemeId, _stakeIndex);
        require(reward > 0, "Not Enough reward");
        userStake.lastRewardAt +=
            _getRepeatNumberOfPeriods(msg.sender, _schemeId, _stakeIndex) *
            scheme.rewardDuration;
        totalClaimedRewards[msg.sender][_schemeId] += reward;
        userStake.accumulatedReward += reward;

        require(stakingToken.transfer(msg.sender, reward), "Transfer failed");

        emit claimed(msg.sender, _schemeId, reward, _stakeIndex);
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

    function getTotalClaimedRewards(
        address _user,
        uint256 _schemeId
    ) external view returns (uint256) {
        return totalClaimedRewards[_user][_schemeId];
    }
}
