import React, { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { Clock, Percent, Coins, AlertCircle, Sparkles, History } from 'lucide-react';
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead, useContractReads } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, STAKING_ABI, TOKEN_ABI } from '../config/contracts';
import { toast } from 'react-toastify';

interface StakingPlanProps {
  name: string;
  range: string;
  bonus: string;
  period: string;
  duration: string;
  totalBonus: string;
  theme: string;
  borderColor: string;
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
  borderColor,
  minStake,
  maxStake,
  isWalletConnected,
  schemeId
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const { address } = useAccount();
  const [rewardContract, setRewardContract] = useState([] as any[])
  const [userStakes, setUserStakes] = useState([] as any[])
  const [totalReward, setTotalReward] = useState(0)
  const [rewardData, setRewardData] = useState([] as any[])
  const [stakeID, setStakeID] = useState(-1)
  // const [isClaimed, setClaimed] = useState([] as boolean[])
  // const [isStaked, setUnStaked] = useState([] as boolean[])
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
  useEffect(() => {
    const tempContract = [] as any[];
    const tempUser = userStakesData as any[] || [];
    tempUser.map((stake: any, index: number) => {
      // if (stake.isActive) {
        tempContract.push({
          address: STAKING_CONTRACT_ADDRESS,
          abi: STAKING_ABI,
          functionName: 'calculateReward',
          args: address ? [address, BigInt(schemeId), BigInt(index)] : undefined,
        });
      // }
    });
    setRewardContract(tempContract)
    setUserStakes(tempUser)
  }, [userStakesData])

  const { data: rewards } = useContractReads({ contracts: rewardContract });

  useEffect(() => {
    const tempRewardsData = rewards as any[];
    const rewardData = [] as any[]; // rewardData per stake
    let totalReward = 0;   // totalReward per scheme
    tempRewardsData?.map((reward) => {
      if (reward.status === 'success') {
        rewardData.push(formatEther(reward.result as bigint));
        totalReward += Number(formatEther(reward.result as bigint));
      }
    })
    setRewardData(rewardData)
    setTotalReward(totalReward)
  }, [rewards])

  // Calculate total rewards across all schemes
  
  const getErrorMessage = (data: any) => {
    if (!data || !data.message) return 'Transaction Failed';
    const temp1 = data.message.split('\n\n');
    if (temp1.length === 0) return 'Transaction Failed';
    const temp2 = temp1[0].split(':\n');
    return temp2[temp2.length - 1];
  };

  const { data: approveData, write: approve } = useContractWrite({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'approve',
  });

  const { data: stakeTokenData, write: stake } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'stake',
    onError(err) {
      toast.error(getErrorMessage(err));
    }
  });

  const { data: UnstakeData, write: unstake } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'unstake',
    onError(err) {
      toast.error(getErrorMessage(err));
    }
  });

  const { data: claimData, write: claim } = useContractWrite({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'claim',
    onError(err) {
      console.log('claim', err)
      toast.error(getErrorMessage(err));
    }
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
      toast.success("Staking is done successfully!");
      setAmount('');
    },
  });

  const { isLoading: unstaking } = useWaitForTransaction({
    hash: UnstakeData?.hash,
    onSuccess() {
      toast.success("Unstaking is done successfully!");
    },

  });

  const { isLoading: claiming } = useWaitForTransaction({
    hash: claimData?.hash,
    onSuccess() {
      toast.success("Claiming is done successfully!");
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

  const handleUnStake = async (index: number) => {
    setStakeID(index)
    if (!error && address) {
      try {
        unstake({
          args: [BigInt(schemeId), BigInt(index)],
        });
      } catch (err) {
        console.error('UnStake error:', err);
        setError('Failed to UnStake tokens');
      }
    }
  };
  const handleClaim = async (index: number) => {
    setStakeID(index)
    if (!error && address) {
      try {
        claim({
          args: [BigInt(schemeId), BigInt(index)],
        });
      } catch (err) {
        console.error('Claim error:', err);
        setError('Failed to Claim tokens');
      }
    }
  };

  function getRewardPeriodInDays(duration: string): number {
    switch (duration) {
      case 'Daily':
        return 1*3600*24;
      case 'Weekly':
        return 7*3600*24;
      case 'Bi-Weekly(15 days)':
        return 15*3600*24;
      case 'Monthly':
        return 30*3600*24;
      default:
        return 1*3600*24;
    }
  }

  // useEffect(()=>{
  //   const timer = setTimeout(() => {
      
  //   }, 5000); // 5 seconds delay

  //   // Cleanup function
  //   return () => clearTimeout(timer);
  // }, []);

  function convertTimestamp(timestamp: number, locklevel: string): string {
    var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
      yyyy = d.getFullYear(),
      mm = ("0" + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
      dd = ("0" + d.getDate()).slice(-2), // Add leading 0.
      hh = d.getHours(),
      h = hh,
      min = ("0" + d.getMinutes()).slice(-2), // Add leading 0.
      ampm = "AM",
      time;

    // var now = new Date();
    // if (now.getFullYear() < yyyy && now.getMonth() < d.getMonth() && now.getDate() < d.getDate() && now.getHours() < d.getHours() && now.getMinutes() < d.getMinutes()) {
    //   if (locklevel == 'unstake')
    //     setIsUnStaking(false);
    //   else if (locklevel == 'claim')
    //     setIsClaiming(false);
    // }
    // else{
    //   if (locklevel == 'unstake')
    //     setIsUnStaking(true);
    //   else if (locklevel == 'claim')
    //     setIsClaiming(true);
    // }

    if (hh > 12) {
      h = hh - 12;
      ampm = "PM";
    } else if (hh === 12) {
      h = 12;
      ampm = "PM";
    } else if (hh == 0) {
      h = 12;
    }

    // ie: 2014-03-24, 3:00 PM
    if (yyyy >= 2025)
      time = yyyy + "-" + mm + "-" + dd + ", " + h + ":" + min + " " + ampm;
    else
      time = ""
    return time;
  }

  return (
    <div className="relative bg-navy-800/50  rounded-xl overflow-hidden border border-navy-700/50 transform hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
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
          {
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-navy-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="w-5 h-5 text-amber-400 mr-2" />
                    <span className="text-gray-400">Total Staked:</span>
                  </div>
                  <span className="text-white font-bold">{Number(totalStaked).toFixed(2)} AKZ</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 text-amber-400 mr-2" />
                    <span className="text-gray-400">Claimable Reward:</span>
                  </div>
                  <span className="text-white font-bold">{Number(totalReward).toFixed(4)} AKZ</span>
                </div>
              </div>
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
              {userStakes.length > 0 && (
                <div className="p-4 bg-navy-700/30 rounded-lg space-y-3">
                  <h4 className="text-white font-semibold mb-2">Active Stakes</h4>
                  {userStakes.map((stake: any, index: number) => (
                    stake.isActive && (
                      <div key={index} className={`flex-col items-center justify-between text-sm border-2 rounded-md ${borderColor} p-4`}>
                        <span className="text-gray-400">Stake #{index + 1}:</span>
                        <div className='flex justify-between'>
                          <span className="text-gray-200 font-medium">
                            Staked Amount:
                          </span>
                          <span className="text-white font-medium">
                            {formatEther(stake.amount)} AKZ
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className="text-gray-200 font-medium">
                            Reward Amount:
                          </span>
                          <span className="text-white font-medium">
                            {Number(rewardData[index]).toFixed(4)} AKZ
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className="text-gray-200 font-medium">
                            Unstake Time:
                          </span>
                          <span className="text-white font-medium">
                            {convertTimestamp(Number(stake.startTime) + 364*3600*24, 'unstake')}  
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className="text-gray-200 font-medium">
                            Claim Time:
                          </span>
                          <span className="text-white font-medium">
                            {(Number(stake.lastRewardAt) < Number(stake.startTime) + 364*3600*24) ? convertTimestamp(Number(stake.lastRewardAt) + getRewardPeriodInDays(period), 'claim') : "can't claim"}
                          </span>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 justify-between gap-2 mt-2'>
                          <button
                            onClick={() => handleUnStake(index)}
                            // disabled={isUnStaked}
                            className={clsx(
                              "w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300",
                              "transform hover:translate-y-[-2px]",
                              // isUnStaked
                                // ?"bg-navy-600 text-gray-400 cursor-not-allowed"
                                "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-900 shadow-lg shadow-amber-500/20"
                            )}
                          >
                            {unstaking && stakeID === index? 'UnStaking...' : 'UnStake'}
                          </button>
                          <button
                            onClick={() => handleClaim(index)}
                            // disabled={isClaimed}
                            className={clsx(
                              "w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300",
                              "transform hover:translate-y-[-2px]",
                              // isClaimed
                                // ? "bg-navy-600 text-gray-400 cursor-not-allowed"
                                "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-900 shadow-lg shadow-amber-500/20"
                            )}
                          >
                            {claiming && stakeID === index ? 'Claiming...' : 'Claim'}
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default StakingPlan;