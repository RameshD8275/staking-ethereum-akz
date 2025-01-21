import React, { useMemo } from 'react';
import { Calendar, ArrowUpRight, Sparkles, Clock } from 'lucide-react';
import { useAccount, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../config/contracts';

// Helper function to get plan name
const getPlanName = (schemeId: number): string => {
  switch (schemeId) {
    case 1: return 'Bronze Plan';
    case 2: return 'Silver Plan';
    case 3: return 'Gold Plan';
    case 4: return 'Quick Plan';
    default: return 'Unknown Plan';
  }
};

// Format date helper
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RewardsHistory = () => {
  const { address, isConnected } = useAccount();
  const schemes = [1, 2, 3, 4]; // All scheme IDs

  // Get user stakes for all schemes
  const stakesData = schemes.map(schemeId => {
    const { data: userStakes } = useContractRead({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'getUserStakes',
      args: address ? [address, BigInt(schemeId)] : undefined,
      enabled: isConnected,
      watch: true,
    });

    const { data: totalClaimedRewards } = useContractRead({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'getTotalClaimedRewards',
      args: address ? [address, BigInt(schemeId)] : undefined,
      enabled: isConnected,
      watch: true,
    });

    return {
      schemeId,
      stakes: userStakes as any[] || [],
      totalClaimed: totalClaimedRewards ? formatEther(totalClaimedRewards as bigint) : '0'
    };
  });

  // Process all stakes to create reward history
  const rewardHistory = useMemo(() => {
    const history: Array<{
      date: Date;
      amount: string;
      plan: string;
      stakeIndex: number;
      schemeId: number;
      lastRewardTime: bigint;
      accumulatedReward: bigint;
    }> = [];

    stakesData.forEach(({ schemeId, stakes }) => {
      if (!stakes) return;

      stakes.forEach((stake: any) => {
        if (stake.accumulatedReward > 0n) {
          history.push({
            date: new Date(Number(stake.lastRewardTime) * 1000),
            amount: formatEther(stake.accumulatedReward),
            plan: getPlanName(schemeId),
            stakeIndex: Number(stake.stakeIndex),
            schemeId,
            lastRewardTime: stake.lastRewardTime,
            accumulatedReward: stake.accumulatedReward
          });
        }
      });
    });

    // Sort by date, most recent first
    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [stakesData]);

  // Calculate total rewards
  const totalRewards = useMemo(() => {
    return stakesData.reduce((total, { totalClaimed }) => {
      return total + Number(totalClaimed);
    }, 0);
  }, [stakesData]);

  return (
    <div className="space-y-6">
      {/* Total Rewards Summary */}
      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Sparkles className="text-amber-400 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Total Rewards Earned</h3>
              <p className="text-gray-400">Lifetime earnings across all plans</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {totalRewards.toFixed(4)} AKZ
            </p>
          </div>
        </div>
      </div>

      {/* Rewards History List */}
      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl border border-navy-700/50 overflow-hidden">
        <div className="p-6 border-b border-navy-700">
          <h2 className="text-xl font-bold text-white">Rewards History</h2>
        </div>
        <div className="p-6">
          {rewardHistory.length > 0 ? (
            <div className="space-y-4">
              {rewardHistory.map((reward, index) => (
                <div
                  key={`${reward.schemeId}-${reward.stakeIndex}-${index}`}
                  className="flex items-center justify-between p-4 bg-navy-700/30 rounded-lg hover:bg-navy-700/50 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{reward.amount} AKZ</p>
                      <div className="flex items-center text-sm text-gray-400 space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(reward.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300">{reward.plan}</p>
                    <p className="text-sm text-amber-400">
                      Stake #{reward.stakeIndex + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No rewards history available yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start staking to earn rewards and build your history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsHistory;