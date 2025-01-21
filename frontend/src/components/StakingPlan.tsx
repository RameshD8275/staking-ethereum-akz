import React, { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { 
  Clock, 
  Percent, 
  Coins, 
  AlertCircle, 
  Sparkles, 
  History, 
  Award, 
  Unlock, 
  Timer,
  Wallet,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, STAKING_ABI, TOKEN_ABI } from '../config/contracts';

const MAX_STAKES = 10; // Maximum number of stakes to track

interface StakingPlanProps {
  name: string;
  range: string;
  bonus: string;
  period: string;
  duration: string;
  totalBonus: string;
  theme: string;
  minStake: number;
  maxStake: number;
  isWalletConnected: boolean;
  schemeId: number;
  icon: React.ReactNode;
}

const StakingPlan: React.FC<StakingPlanProps> = ({
  name,
  range,
  bonus,
  period,
  duration,
  totalBonus,
  theme,
  minStake,
  maxStake,
  isWalletConnected,
  schemeId,
  icon
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const { address } = useAccount();

  // Contract reads
  const { data: schemeStats } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getSchemeStats',
    args: [BigInt(schemeId)],
    watch: true,
  });

  const { data: totalStakedData } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getTotalStaked',
    args: address ? [address, BigInt(schemeId)] : undefined,
    enabled: !!address,
    watch: true,
  });

  const { data: userStakesData } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getUserStakes',
    args: address ? [address, BigInt(schemeId)] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Get active stakes from user stakes data first
  const activeStakes = useMemo(() => {
    if (!userStakesData) return [];
    return (userStakesData as any[]).filter(stake => stake?.isActive);
  }, [userStakesData]);

  // Pre-declare reward calculation hooks with proper enabling
  const rewardHooks = Array.from({ length: MAX_STAKES }, (_, index) => {
    return useContractRead({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'calculateReward',
      args: address && activeStakes[index] 
        ? [address, BigInt(schemeId), activeStakes[index].stakeIndex] 
        : undefined,
      enabled: !!address && !!activeStakes[index]?.isActive,
      watch: true,
    });
  });

  // Contract writes
  const { data: approveData, write: approve } = useContractWrite({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'approve',
  });

  const { data: stakeData, write: stake } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'stake',
  });

  const { data: unstakeData, write: unstake } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'unstake',
  });

  const { data: claimData, write: claimReward } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'claimReward',
  });

  // Transaction states
  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess() {
      setIsApproved(true);
      if (stake && amount) {
        stake({
          args: [BigInt(schemeId), parseEther(amount)],
        });
      }
    },
  });

  const { isLoading: isStaking } = useWaitForTransaction({
    hash: stakeData?.hash,
    onSuccess() {
      setAmount('');
      setIsApproved(false);
    },
  });

  const { isLoading: isUnstaking } = useWaitForTransaction({
    hash: unstakeData?.hash,
  });

  const { isLoading: isClaiming } = useWaitForTransaction({
    hash: claimData?.hash,
  });

  // Memoized values
  const totalStakedInScheme = useMemo(() => 
    schemeStats ? formatEther(schemeStats[0] as bigint) : '0',
  [schemeStats]);

  const userTotalStaked = useMemo(() => 
    totalStakedData ? formatEther(totalStakedData as bigint) : '0',
  [totalStakedData]);

  // Helper functions
  const getStakeDuration = useCallback((schemeId: number): number => {
    switch(schemeId) {
      case 1: return 15 * 24 * 60 * 60; // Bronze: 15 days
      case 2: return 30 * 24 * 60 * 60; // Silver: 30 days
      case 3: return 90 * 24 * 60 * 60; // Gold: 90 days
      case 4: return 60 * 60; // Quick: 1 hour
      default: return 15 * 24 * 60 * 60;
    }
  }, []);

  const getMinRewardPeriod = useCallback((schemeId: number): number => {
    switch(schemeId) {
      case 1: return 24 * 60 * 60; // Bronze: 1 day
      case 2: return 2 * 24 * 60 * 60; // Silver: 2 days
      case 3: return 3 * 24 * 60 * 60; // Gold: 3 days
      case 4: return 15 * 60; // Quick: 15 minutes
      default: return 24 * 60 * 60;
    }
  }, []);

  const formatTimeLeft = useCallback((seconds: number): string => {
    if (seconds <= 0) return 'Ready to claim';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  }, []);

  const activeStakesWithRewards = useMemo(() => {
    return activeStakes.map((stake, index) => {
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const stakeDuration = getStakeDuration(schemeId);
      const minRewardPeriod = getMinRewardPeriod(schemeId);
      const timeElapsed = currentTime - stake.startTime;
      const timeUntilReward = stake.lastRewardTime + BigInt(minRewardPeriod) - currentTime;
      
      // Get reward data from the corresponding hook
      const rewardData = rewardHooks[index]?.data;
      const reward = rewardData ? formatEther(rewardData as bigint) : '0';
      
      return {
        ...stake,
        reward,
        timeElapsed: Number(timeElapsed),
        canClaimReward: timeElapsed >= BigInt(minRewardPeriod) && 
                       currentTime >= stake.lastRewardTime + BigInt(minRewardPeriod),
        timeUntilNextReward: Number(timeUntilReward > 0n ? timeUntilReward : 0n),
        isLockPeriodComplete: currentTime >= stake.startTime + BigInt(stakeDuration)
      };
    });
  }, [activeStakes, rewardHooks, schemeId, getStakeDuration, getMinRewardPeriod]);

  // Event handlers
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setIsApproved(false);
    
    const numValue = Number(value);
    const currentTotal = Number(userTotalStaked) + numValue;
    
    if (numValue < minStake) {
      setError(`Minimum stake is ${minStake} AKZ`);
    } else if (currentTotal > maxStake) {
      setError(`Total stake cannot exceed ${maxStake} AKZ`);
    } else {
      setError('');
    }
  }, [minStake, maxStake, userTotalStaked]);

  const handleStakeClick = useCallback(async () => {
    if (!error && amount && address) {
      if (!isApproved) {
        approve?.({
          args: [STAKING_CONTRACT_ADDRESS, parseEther(amount)],
        });
      } else {
        stake?.({
          args: [BigInt(schemeId), parseEther(amount)],
        });
      }
    }
  }, [error, amount, address, isApproved, approve, stake, schemeId]);

  const handleClaimReward = useCallback(async (stakeIndex: bigint) => {
    if (claimReward) {
      try {
        await claimReward({
          args: [BigInt(schemeId), stakeIndex],
        });
      } catch (error) {
        console.error('Error claiming reward:', error);
      }
    }
  }, [claimReward, schemeId]);

  const handleUnstake = useCallback((stakeIndex: bigint) => {
    if (unstake) {
      unstake({
        args: [BigInt(schemeId), stakeIndex],
      });
    }
  }, [unstake, schemeId]);

  const getButtonText = useCallback(() => {
    if (isApproving) return 'Approving...';
    if (isStaking) return 'Staking...';
    if (!isApproved) return 'Approve & Stake';
    return 'Stake Now';
  }, [isApproving, isStaking, isApproved]);

  return (
    <div className="relative bg-navy-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-navy-700/50 hover-card group">
      {/* Header */}
      <div className={`p-6 bg-gradient-to-r ${theme} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-animate"></div>
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
            <div className="flex items-center text-white/80">
              <Coins className="w-4 h-4 mr-2" />
              <span>{range}</span>
            </div>
          </div>
          <div className="p-3 bg-white/10 rounded-lg transform transition-transform group-hover:rotate-12">
            {icon}
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Plan Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-gray-300 p-2 rounded-lg hover:bg-navy-700/30 transition-colors">
            <div className="flex items-center">
              <Percent className="w-4 h-4 mr-2 text-amber-400" />
              <span>Bonus Rate</span>
            </div>
            <span className="font-semibold text-white">{bonus}</span>
          </div>
          
          <div className="flex items-center justify-between text-gray-300 p-2 rounded-lg hover:bg-navy-700/30 transition-colors">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-amber-400" />
              <span>Reward Period</span>
            </div>
            <span className="font-semibold text-white">{period}</span>
          </div>
          
          <div className="flex items-center justify-between text-gray-300 p-2 rounded-lg hover:bg-navy-700/30 transition-colors">
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-2 text-amber-400" />
              <span>Duration</span>
            </div>
            <span className="font-semibold text-white">{duration}</span>
          </div>
        </div>
        
        {/* Staking Stats */}
        <div className="pt-6 border-t border-navy-700/50">
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-navy-700/30 rounded-lg hover:bg-navy-700/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <History className="w-5 h-5 text-amber-400 mr-2" />
                  <span className="text-gray-400">Total Staked in Plan:</span>
                </div>
                <span className="text-white font-bold">{Number(totalStakedInScheme).toFixed(4)} AKZ</span>
              </div>
            </div>
            
            {Number(userTotalStaked) > 0 && (
              <div className="p-4 bg-navy-700/30 rounded-lg hover:bg-navy-700/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="w-5 h-5 text-amber-400 mr-2" />
                    <span className="text-gray-400">Your Total Staked:</span>
                  </div>
                  <span className="text-white font-bold">{Number(userTotalStaked).toFixed(4)} AKZ</span>
                </div>
              </div>
            )}
            
            {/* Active Stakes */}
            {activeStakesWithRewards.length > 0 && (
              <div className="p-4 bg-navy-700/30 rounded-lg space-y-3">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <Award className="w-5 h-5 text-amber-400 mr-2" />
                  Active Stakes
                </h4>
                {activeStakesWithRewards.map((stake) => (
                  <div key={String(stake.stakeIndex)} className="space-y-2 p-3 bg-navy-700/30 rounded-lg hover:bg-navy-700/40 transition-colors">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Stake #{Number(stake.stakeIndex) + 1}:</span>
                      <span className="text-white font-medium">
                        {formatEther(stake.amount)} AKZ
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-amber-400 mr-2" />
                        <span className="text-gray-400">
                          {stake.isLockPeriodComplete 
                            ? 'Lock Period Complete'
                            : 'Lock Period Active'}
                        </span>
                      </div>
                    </div>

                    {!stake.isLockPeriodComplete && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Timer className="w-4 h-4 text-amber-400 mr-2" />
                          <span className="text-gray-400">Next Reward:</span>
                        </div>
                        <span className="text-amber-400">
                          {formatTimeLeft(stake.timeUntilNextReward)}
                        </span>
                      </div>
                    )}

                    {Number(stake.reward) > 0 && !stake.isLockPeriodComplete && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
                          <span className="text-amber-400">Available Reward:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-400 font-medium">
                            {Number(stake.reward).toFixed(4)} AKZ
                          </span>
                          <button
                            onClick={() => handleClaimReward(stake.stakeIndex)}
                            disabled={isClaiming || !stake.canClaimReward}
                            className={clsx(
                              "px-3 py-1 rounded text-sm font-medium transition-all duration-200",
                              (isClaiming || !stake.canClaimReward)
                                ? "bg-amber-500/50 cursor-not-allowed"
                                : "bg-amber-500 hover:bg-amber-600 text-navy-900 hover:shadow-lg hover:shadow-amber-500/20"
                            )}
                          >
                            {isClaiming ? 'Claiming...' : 'Claim'}
                          </button>
                        </div>
                      </div>
                    )}

                    {stake.isLockPeriodComplete && (
                      <div className="flex items-center justify-end mt-2">
                        <button
                          onClick={() => handleUnstake(stake.stakeIndex)}
                          disabled={isUnstaking}
                          className={clsx(
                            "px-4 py-2 rounded text-sm font-medium flex items-center transition-all duration-200",
                            isUnstaking
                              ? "bg-green-500/50 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600 text-white hover:shadow-lg hover:shadow-green-500/20"
                          )}
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          {isUnstaking ? 'Unstaking...' : 'Unstake'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Total Bonus */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-400 animate-float" />
              <div className="absolute -inset-1 bg-amber-400/20 rounded-full blur-sm"></div>
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {totalBonus} Total Bonus
            </p>
          </div>
          
          {/* Staking Form */}
          {isWalletConnected && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount to stake"
                  className="w-full px-4 py-3 bg-navy-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
                />
                {error && (
                  <div className="absolute -bottom-6 left-0 flex items-center text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleStakeClick}
                disabled={!!error || !amount || isApproving || isStaking}
                className={clsx(
                  "w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300",
                  "transform hover:translate-y-[-2px] group",
                  error || !amount || isApproving || isStaking
                    ? "bg-navy-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-900 shadow-lg shadow-amber-500/20"
                )}
              >
                <span className="flex items-center justify-center">
                  {getButtonText()}
                  <ChevronRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakingPlan;