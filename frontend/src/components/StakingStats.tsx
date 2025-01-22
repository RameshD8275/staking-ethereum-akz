import { useState, useEffect } from 'react';
import { Coins, Clock, Percent, TrendingUp } from 'lucide-react';
import { useAccount, useContractRead, useContractReads } from 'wagmi';
import { formatEther } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_ABI } from '../config/contracts';

const StakingStats = () => {
  const { address } = useAccount();
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [rewardContracts, setRewardContracts] = useState([] as any[])
  // Get total staked for all schemes
  const schemes = [1, 2, 3, 4];
  const totalStakedContracts = [] as any[];
  const userStakedContracts = [] as any[];
  schemes.map((schemeId: number) => {
    totalStakedContracts.push(
      {
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'getTotalStaked',
        args: address ? [address, BigInt(schemeId)] : undefined,
        watch: true,
      }
    )

    userStakedContracts.push(
      {
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'getUserStakes',
        args: address ? [address, BigInt(schemeId)] : undefined,
        watch: true,
      }
    )

  })

  const { data: stakedData } = useContractReads({ contracts: totalStakedContracts })
  const { data: userData } = useContractReads({ contracts: userStakedContracts })

  useEffect(() => {
    if (userData === undefined) return;
    const tempRewardContract = [] as any[];
    console.log('userData', userData)
    userData?.map((data: any, index: number) => {
      let numStakePerScheme = data?.result?.length;
      
      for (let i = 0; i < numStakePerScheme; i++) {
        console.log('Nightfury',numStakePerScheme, data, BigInt(index), BigInt(i))
        tempRewardContract.push(
          {
            address: STAKING_CONTRACT_ADDRESS,
            abi: STAKING_ABI,
            functionName: 'calculateReward',
            args: address ? [address, BigInt(index + 1), BigInt(i)] : undefined,
          }
        )
      }
    })
    setRewardContracts(tempRewardContract)
  }, [userData])

  const { data: rewards } = useContractReads({ contracts: rewardContracts })
  useEffect(() => {
    if (rewards === undefined) return;
    console.log('rewards', rewards);
    let sumReward = 0;
    rewards?.map((reward)=>{
      if(reward.result !== undefined)
        sumReward += Number(formatEther(reward.result as bigint));
    })
    setTotalReward(sumReward)
  }, [rewards])

  useEffect(() => {
    if (stakedData === undefined) return;
    let sum = 0;
    stakedData?.forEach((data) => {
      if (data.result !== undefined)
        sum += Number(formatEther(data.result as bigint));
    })
    setTotalStaked(sum);
  }, [stakedData])


  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
            <Coins className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Total Staked</h3>
        </div>
        <p className="text-2xl font-bold text-white">{totalStaked} AKZ</p>
        <p className="text-sm text-gray-400 mt-1">≈ ${(totalStaked * 0.1).toFixed(2)} USD</p>
      </div>

      <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700/50 transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
            <Percent className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Total Rewards</h3>
        </div>
        <p className="text-2xl font-bold text-white">{totalReward.toFixed(4)} AKZ</p>
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