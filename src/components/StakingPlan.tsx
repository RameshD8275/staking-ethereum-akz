import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Clock, Percent, Coins, AlertCircle, Sparkles, History } from 'lucide-react';
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, STAKING_ABI, TOKEN_ABI } from '../config/contracts';

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
  schemeId
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const { address } = useAccount();

  // Get total staked amount
  const { data: totalStakedData } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getTotalStaked',
    args: address ? [address, BigInt(schemeId)] : undefined,
    watch: true,
  });

  // Get user stakes
  const { data: userStakesData } = useContractRead({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getUserStakes',
    args: address ? [address, BigInt(schemeId)] : undefined,
    watch: true,
  });

  const totalStaked = totalStakedData ? formatEther(totalStakedData as bigint) : '0';
  const userStakes = userStakesData as any[] || [];

  const { data: approveData, write: approve } = useContractWrite({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'approve',
  });

  const { data: stakeTokenData, write: stake } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'stake',
  });

  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess() {
      if (stake && amount) {
        stake({
          args: [BigInt(schemeId), parseEther(amount)],
        });
      }
    },
  });

  const { isLoading: isStaking } = useWaitForTransaction({
    hash: stakeTokenData?.hash,
    onSuccess() {
      setAmount('');
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    const numValue = Number(value);
    const currentTotal = Number(totalStaked) + numValue;
    
    if (numValue < minStake) {
      setError(`Minimum stake is ${minStake} AKZ`);
    } else if (currentTotal > maxStake) {
      setError(`Total stake cannot exceed ${maxStake} AKZ`);
    } else {
      setError('');
    }
  };

  const handleStake = async () => {
    if (!error && amount && address && approve) {
      try {
        approve({
          args: [STAKING_CONTRACT_ADDRESS, parseEther(amount)],
        });
      } catch (err) {
        console.error('Approval error:', err);
        setError('Failed to approve tokens');
      }
    }
  };

  return (
    <div className="relative bg-navy-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-navy-700/50 transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      <div className={`p-6 bg-gradient-to-r ${theme}`}>
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <div className="flex items-center text-white/80">
          <Coins className="w-4 h-4 mr-2" />
          <span>{range}</span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between text-gray-300">
          <div className="flex items-center">
            <Percent className="w-4 h-4 mr-2 text-amber-400" />
            <span>Bonus Rate</span>
          </div>
          <span className="font-semibold text-white">{bonus}</span>
        </div>
        
        <div className="flex items-center justify-between text-gray-300">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-400" />
            <span>Reward Period</span>
          </div>
          <span className="font-semibold text-white">{period}</span>
        </div>
        
        <div className="flex items-center justify-between text-gray-300">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-400" />
            <span>Duration</span>
          </div>
          <span className="font-semibold text-white">{duration}</span>
        </div>
        
        <div className="pt-6 border-t border-navy-700/50">
          {Number(totalStaked) > 0 && (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-navy-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="w-5 h-5 text-amber-400 mr-2" />
                    <span className="text-gray-400">Total Staked:</span>
                  </div>
                  <span className="text-white font-bold">{Number(totalStaked).toFixed(2)} AKZ</span>
                </div>
              </div>
              
              {userStakes.length > 0 && (
                <div className="p-4 bg-navy-700/30 rounded-lg space-y-3">
                  <h4 className="text-white font-semibold mb-2">Active Stakes</h4>
                  {userStakes.map((stake: any, index: number) => (
                    stake.isActive && (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Stake #{index + 1}:</span>
                        <span className="text-white font-medium">
                          {formatEther(stake.amount)} AKZ
                        </span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <p className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {totalBonus} Total Bonus
            </p>
          </div>
          
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
                onClick={handleStake}
                disabled={!!error || !amount || isApproving || isStaking}
                className={clsx(
                  "w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300",
                  "transform hover:translate-y-[-2px]",
                  error || !amount || isApproving || isStaking
                    ? "bg-navy-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-900 shadow-lg shadow-amber-500/20"
                )}
              >
                {isApproving ? 'Approving...' : isStaking ? 'Staking...' : 'Stake Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakingPlan;