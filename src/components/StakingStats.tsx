import React from 'react';
import { Coins, Clock, Percent, TrendingUp } from 'lucide-react';
import { useAccount, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../config/contracts';

const StakingStats = () => {
  const { address } = useAccount();

  // Get total staked for all schemes
  const schemes = [1, 2, 3, 4]; // Your scheme IDs
  const totalStaked = schemes.reduce((acc, schemeId) => {
    const { data: schemeTotal } = useContractRead({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'getTotalStaked',
      args: address ? [address, BigInt(schemeId)] : undefined,
      watch: true,
    });
    
    return acc + (schemeTotal ? Number(formatEther(schemeTotal as bigint)) : 0);
  }, 0);

  // Calculate total rewards across all schemes
  const totalRewards = schemes.reduce((acc, schemeId) => {
    const { data: userStakes } = useContractRead({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'getUserStakes',
      args: address ? [address, BigInt(schemeId)] : undefined,
      watch: true,
    });

    if (!userStakes) return acc;

    const stakes = userStakes as any[];
    let schemeRewards = 0;

    stakes.forEach((stake: any, index: number) => {
      if (stake.isActive) {
        const { data: reward } = useContractRead({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          functionName: 'calculateReward',
          args: address ? [address, BigInt(schemeId), BigInt(index)] : undefined,
          watch: true,
        });

        if (reward) {
          schemeRewards += Number(formatEther(reward as bigint));
        }
      }
    });

    return acc + schemeRewards;
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
            <Coins className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Total Staked</h3>
        </div>
        <p className="text-2xl font-bold text-white">{totalStaked.toFixed(2)} AKZ</p>
        <p className="text-sm text-gray-400 mt-1">≈ ${(totalStaked * 0.1).toFixed(2)} USD</p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
            <Percent className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Total Rewards</h3>
        </div>
        <p className="text-2xl font-bold text-white">{totalRewards.toFixed(2)} AKZ</p>
        <p className="text-sm text-gray-400 mt-1">Lifetime earnings</p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
            <Clock className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Active Stakes</h3>
        </div>
        <p className="text-2xl font-bold text-white">{address ? 'View Plans' : '-'}</p>
        <p className="text-sm text-gray-400 mt-1">Check individual plans</p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
            <TrendingUp className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">APY</h3>
        </div>
        <p className="text-2xl font-bold text-white">Up to 120%</p>
        <p className="text-sm text-gray-400 mt-1">Annual percentage yield</p>
      </div>
    </div>
  );
};

export default StakingStats;