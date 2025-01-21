import React, { useEffect, useState } from 'react';
import { Coins, Clock, Percent, TrendingUp, Award, Users } from 'lucide-react';
import { useAccount, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../config/contracts';

const StakingStats = () => {
  const { address, isConnected } = useAccount();
  const [totalRewards, setTotalRewards] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [activeStakesCount, setActiveStakesCount] = useState(0);
  const schemes = [1, 2, 3, 4];

  // Get scheme stats for all schemes
  const stakingData = schemes.map(schemeId => {
    const { data: schemeStats } = useContractRead({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'getSchemeStats',
      args: [BigInt(schemeId)],
      watch: true,
    });

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

    // Safely handle the schemeStats tuple return value
    const schemeTotalStaked = schemeStats ? formatEther(schemeStats[0] as bigint) : '0';

    return {
      schemeId,
      totalStaked: parseFloat(schemeTotalStaked),
      stakes: userStakes as any[] || [],
      claimedRewards: totalClaimedRewards ? parseFloat(formatEther(totalClaimedRewards as bigint)) : 0
    };
  });

  useEffect(() => {
    const calculatedTotalStaked = stakingData.reduce((acc, data) => acc + data.totalStaked, 0);
    const calculatedTotalRewards = stakingData.reduce((acc, data) => acc + data.claimedRewards, 0);
    const calculatedActiveStakes = stakingData.reduce((acc, data) => {
      return acc + (data.stakes?.filter(stake => stake?.isActive)?.length || 0);
    }, 0);

    setTotalStaked(calculatedTotalStaked);
    setTotalRewards(calculatedTotalRewards);
    setActiveStakesCount(calculatedActiveStakes);
  }, [stakingData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 hover-card">
        <div className="flex items-center mb-2">
          <div className="p-3 bg-amber-500/10 rounded-lg mr-3 animate-float">
            <Coins className="text-amber-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Total Staked</h3>
        </div>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
          {isConnected ? `${totalStaked.toFixed(4)} AKZ` : '-'}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {isConnected ? `≈ $${(totalStaked * 0.1).toFixed(2)} USD` : 'Connect wallet to view'}
        </p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 hover-card">
        <div className="flex items-center mb-2">
          <div className="p-3 bg-amber-500/10 rounded-lg mr-3 animate-float">
            <Award className="text-amber-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Total Rewards</h3>
        </div>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
          {isConnected ? `${totalRewards.toFixed(4)} AKZ` : '-'}
        </p>
        <p className="text-sm text-gray-400 mt-1">Lifetime earnings</p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 hover-card">
        <div className="flex items-center mb-2">
          <div className="p-3 bg-amber-500/10 rounded-lg mr-3 animate-float">
            <Users className="text-amber-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">Active Stakes</h3>
        </div>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
          {isConnected ? activeStakesCount : '-'}
        </p>
        <p className="text-sm text-gray-400 mt-1">Current active stakes</p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 hover-card">
        <div className="flex items-center mb-2">
          <div className="p-3 bg-amber-500/10 rounded-lg mr-3 animate-float">
            <TrendingUp className="text-amber-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">APY</h3>
        </div>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
          Up to 120%
        </p>
        <p className="text-sm text-gray-400 mt-1">Annual percentage yield</p>
      </div>
    </div>
  );
};

export default StakingStats;